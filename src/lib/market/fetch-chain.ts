import "server-only";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import tls from "node:tls";
import { X509Certificate } from "node:crypto";

/*
 * Some servers (CSE's, at times) send their own certificate without the
 * intermediate certificate that links it to a trusted root, so Node.js refuses
 * the connection ("unable to verify the first certificate"). Browsers fix this
 * by downloading the missing intermediate from the address written in the
 * certificate (Authority Information Access); this does the same:
 *
 *  1. read the server's certificate (nothing is sent to the server),
 *  2. download the issuer certificate(s) it names, at most three levels,
 *  3. keep them only if each is a CA certificate, currently valid, and its
 *     signature checks out against a root Node.js already trusts (or an
 *     intermediate that does),
 *  4. connect again with full verification, those intermediates added.
 *
 * Verification is never switched off: a forged certificate still fails.
 */

const CHAIN_ERRORS = new Set(["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY", "UNABLE_TO_GET_ISSUER_CERT"]);

/** True when a fetch failed only because the server's certificate chain is incomplete. */
export function isChainError(error: unknown): boolean {
  for (let e = error as { code?: string; cause?: unknown } | undefined, i = 0; e && i < 5; e = e.cause as typeof e, i++) {
    if (e.code && CHAIN_ERRORS.has(e.code)) return true;
  }
  return false;
}

let roots: { pems: string[]; certs: X509Certificate[] } | null = null;
function trustedRoots() {
  if (roots) return roots;
  const pems = [...tls.rootCertificates];
  // Respect NODE_EXTRA_CA_CERTS (e.g. a company proxy's root) like Node.js does.
  const extra = process.env.NODE_EXTRA_CA_CERTS;
  if (extra && fs.existsSync(extra)) pems.push(...(fs.readFileSync(extra, "utf8").match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) ?? []));
  const certs: X509Certificate[] = [];
  for (const p of pems) {
    try {
      certs.push(new X509Certificate(p));
    } catch {}
  }
  roots = { pems, certs };
  return roots;
}

/** Intermediates found per host, so the extra download happens once per server start. */
const found = new Map<string, string[]>();

function peerCertificate(host: string, port: number): Promise<tls.DetailedPeerCertificate> {
  return new Promise((resolve, reject) => {
    // Only the handshake: the certificate is read and the connection closed, no request is sent.
    const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate(true);
      socket.destroy();
      resolve(cert);
    });
    socket.setTimeout(8000, () => socket.destroy(new Error("TLS timed out")));
    socket.on("error", reject);
  });
}

function download(url: string, redirects = 3): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(url, { timeout: 8000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(download(new URL(res.headers.location, url).toString(), redirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on("data", (c: Buffer) => {
        size += c.length;
        if (size > 64 * 1024) req.destroy(new Error("certificate too large"));
        else chunks.push(c);
      });
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
  });
}

function issuerUrls(info: string | NodeJS.Dict<string[]> | undefined): string[] {
  if (!info) return [];
  if (typeof info === "string") return [...info.matchAll(/CA Issuers - URI:(\S+)/g)].map((m) => m[1]!);
  return info["CA Issuers - URI"] ?? [];
}

function isValidCa(c: X509Certificate) {
  const now = Date.now();
  return c.ca && Date.parse(c.validFrom) <= now && now <= Date.parse(c.validTo);
}

async function missingIntermediates(host: string, port: number): Promise<string[]> {
  const cached = found.get(host);
  if (cached) return cached;
  const leaf = await peerCertificate(host, port);
  const { certs: rootCerts } = trustedRoots();
  const trusted: X509Certificate[] = [...rootCerts];
  const pending: X509Certificate[] = [];
  let urls = issuerUrls(leaf.infoAccess);
  for (let depth = 0; depth < 3 && urls.length; depth++) {
    const url = urls[0]!;
    if (!/^https?:\/\//i.test(url)) break;
    const der = await download(url);
    const cert = new X509Certificate(der);
    if (!isValidCa(cert)) throw new Error(`issuer certificate from ${url} is not a valid CA certificate`);
    pending.push(cert);
    // Stop once the newest certificate is signed by a root Node.js trusts.
    if (trusted.some((r) => r.subject === cert.issuer && cert.verify(r.publicKey))) break;
    urls = issuerUrls(cert.infoAccess);
  }
  // Keep only a chain that verifies link by link down to a trusted root.
  const verified: X509Certificate[] = [];
  for (const cert of [...pending].reverse()) {
    const signer = [...trusted, ...verified].find((r) => r.subject === cert.issuer && cert.verify(r.publicKey));
    if (!signer) throw new Error("the server's certificate chain does not lead to a trusted root");
    verified.push(cert);
  }
  const pems = verified.map((c) => c.toString());
  found.set(host, pems);
  return pems;
}

/** GET a page from a server with an incomplete certificate chain (full verification kept). */
export async function getWithCompletedChain(url: string, headers: Record<string, string>, redirects = 3): Promise<{ status: number; body: string }> {
  const u = new URL(url);
  const port = Number(u.port || 443);
  const extra = await missingIntermediates(u.hostname, port);
  const ca = [...trustedRoots().pems, ...extra];
  return new Promise((resolve, reject) => {
    const req = https.get({ host: u.hostname, port, path: u.pathname + u.search, servername: u.hostname, headers, ca, timeout: 15_000 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolve(getWithCompletedChain(new URL(res.headers.location, url).toString(), headers, redirects - 1));
      }
      res.setEncoding("utf8");
      let body = "";
      res.on("data", (c: string) => {
        body += c;
        if (body.length > 8 * 1024 * 1024) req.destroy(new Error("page too large"));
      });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
  });
}
