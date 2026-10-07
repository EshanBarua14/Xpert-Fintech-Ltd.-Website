import "server-only";
import net from "node:net";
import tls from "node:tls";
import { randomUUID } from "node:crypto";

/**
 * A small SMTP client for the site's notification emails (no extra
 * dependency). Port 465 (or SMTP_SECURE=true) uses TLS from the start; other ports (587, 25) upgrade
 * with STARTTLS when the server offers it, and refuse to send a password over
 * an unencrypted connection. AUTH PLAIN or LOGIN. Plain-text messages, UTF-8
 * subjects and names (RFC 2047), dot-stuffing (RFC 5321).
 *
 * Settings (.env): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM,
 * and optionally SMTP_TLS_REJECT_UNAUTHORIZED=false for a self-signed server.
 */
export type Mail = { to: string[]; subject: string; text: string; replyTo?: string };

export function mailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

const enc = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`);
/** "Name <a@b>" → encoded display name, plain address. */
function address(v: string) {
  const m = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(v);
  return m ? { header: `${m[1] ? enc(m[1]) + " " : ""}<${m[2]}>`, addr: m[2]! } : { header: `<${v.trim()}>`, addr: v.trim() };
}
const clean = (s: string) => s.replace(/[\r\n]+/g, " ").trim(); // no header injection

function buildMessage(from: string, mail: Mail): string {
  const body = Buffer.from(mail.text.replace(/\r?\n/g, "\r\n"), "utf8")
    .toString("base64")
    .replace(/.{1,76}/g, "$&\r\n");
  const headers = [
    `From: ${address(from).header}`,
    `To: ${mail.to.map((t) => address(t).header).join(", ")}`,
    `Subject: ${enc(clean(mail.subject))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@${address(from).addr.split("@")[1] ?? "localhost"}>`,
    ...(mail.replyTo ? [`Reply-To: ${address(clean(mail.replyTo)).header}`] : []),
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
  ];
  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

type Conn = { socket: net.Socket | tls.TLSSocket; read: () => Promise<{ code: number; text: string }>; write: (s: string) => void };

function wrap(socket: net.Socket | tls.TLSSocket): Conn {
  let buffer = "";
  const waiting: ((r: { code: number; text: string } | Error) => void)[] = [];
  const replies: { code: number; text: string }[] = [];
  const flush = () => {
    // A reply ends with a line "250 text" (space after the code); "250-text" continues.
    for (;;) {
      const m = /^(?:\d{3}-[^\r\n]*\r?\n)*(\d{3}) [^\r\n]*\r?\n/.exec(buffer);
      if (!m) return;
      buffer = buffer.slice(m[0].length);
      const r = { code: Number(m[1]), text: m[0] };
      const w = waiting.shift();
      if (w) w(r);
      else replies.push(r);
    }
  };
  socket.on("data", (d) => {
    buffer += d.toString("utf8");
    flush();
  });
  const fail = (e: Error) => {
    while (waiting.length) waiting.shift()!(e);
  };
  socket.on("error", fail);
  socket.on("close", () => fail(new Error("SMTP connection closed")));
  return {
    socket,
    write: (s) => socket.write(s),
    read: () =>
      new Promise((resolve, reject) => {
        const r = replies.shift();
        if (r) return resolve(r);
        waiting.push((x) => (x instanceof Error ? reject(x) : resolve(x)));
      }),
  };
}

async function expect(c: Conn, ok: number[], what: string) {
  const r = await c.read();
  if (!ok.includes(r.code)) throw new Error(`SMTP ${what} failed: ${r.text.trim()}`);
  return r;
}

export async function sendMail(mail: Mail): Promise<void> {
  const host = process.env.SMTP_HOST;
  const from = process.env.MAIL_FROM;
  if (!host || !from) throw new Error("SMTP is not configured (SMTP_HOST, MAIL_FROM)");
  if (!mail.to.length) return;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASSWORD || "";
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";
  const timeout = 15_000;

  const implicitTls = process.env.SMTP_SECURE === "true" || port === 465;
  const raw: net.Socket | tls.TLSSocket =
    implicitTls ? tls.connect({ host, port, servername: host, rejectUnauthorized }) : net.connect({ host, port });
  raw.setTimeout(timeout, () => raw.destroy(new Error("SMTP timed out")));
  let c = wrap(raw);
  try {
    await expect(c, [220], "greeting");
    const name = "xpertfintech.com";
    c.write(`EHLO ${name}\r\n`);
    let ehlo = await expect(c, [250], "EHLO");
    let secure = implicitTls;
    if (!secure && /STARTTLS/i.test(ehlo.text)) {
      c.write("STARTTLS\r\n");
      await expect(c, [220], "STARTTLS");
      raw.removeAllListeners("data");
      const upgraded = tls.connect({ socket: raw as net.Socket, servername: host, rejectUnauthorized });
      await new Promise<void>((resolve, reject) => {
        upgraded.once("secureConnect", () => resolve());
        upgraded.once("error", reject);
      });
      upgraded.setTimeout(timeout, () => upgraded.destroy(new Error("SMTP timed out")));
      c = wrap(upgraded);
      secure = true;
      c.write(`EHLO ${name}\r\n`);
      ehlo = await expect(c, [250], "EHLO after STARTTLS");
    }
    if (user) {
      if (!secure) throw new Error("SMTP server does not offer encryption; refusing to send the password in clear text");
      if (/AUTH[^\r\n]*PLAIN/i.test(ehlo.text)) {
        c.write(`AUTH PLAIN ${Buffer.from(`\0${user}\0${pass}`, "utf8").toString("base64")}\r\n`);
        await expect(c, [235], "AUTH PLAIN");
      } else {
        c.write("AUTH LOGIN\r\n");
        await expect(c, [334], "AUTH LOGIN");
        c.write(`${Buffer.from(user, "utf8").toString("base64")}\r\n`);
        await expect(c, [334], "AUTH LOGIN user");
        c.write(`${Buffer.from(pass, "utf8").toString("base64")}\r\n`);
        await expect(c, [235], "AUTH LOGIN password");
      }
    }
    c.write(`MAIL FROM:<${address(from).addr}>\r\n`);
    await expect(c, [250], "MAIL FROM");
    for (const to of mail.to) {
      c.write(`RCPT TO:<${address(to).addr}>\r\n`);
      await expect(c, [250, 251], "RCPT TO");
    }
    c.write("DATA\r\n");
    await expect(c, [354], "DATA");
    const msg = buildMessage(from, mail).replace(/^\./gm, ".."); // dot-stuffing
    c.write(`${msg}\r\n.\r\n`);
    await expect(c, [250], "message");
    c.write("QUIT\r\n");
  } finally {
    setTimeout(() => c.socket.destroy(), 200).unref();
  }
}

/** Sends with up to three attempts (after 0 s, 5 s and 30 s). Errors are logged, never thrown. */
export async function sendMailWithRetry(mail: Mail, label: string): Promise<boolean> {
  const delays = [0, 5_000, 30_000];
  for (const [i, wait] of delays.entries()) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      await sendMail(mail);
      return true;
    } catch (error) {
      console.error(`[mail] ${label}: attempt ${i + 1} of ${delays.length} failed:`, (error as Error)?.message ?? error);
    }
  }
  return false;
}
