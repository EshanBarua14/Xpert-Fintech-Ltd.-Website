import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Time-based one-time codes (RFC 6238: 6 digits, 30-second steps, SHA-1),
 * the kind shown by Google Authenticator, Microsoft Authenticator, 1Password…
 *
 * The shared secret is stored encrypted (AES-256-GCM) with a key derived from
 * SESSION_SECRET, so a database copy alone cannot generate codes. Changing
 * SESSION_SECRET therefore switches off every admin's two-factor sign-in.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error("Invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** A new random 160-bit secret, base32-encoded (32 characters). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** The code for one 30-second step. */
export function totpCode(secret: Buffer, step: number, digits = DIGITS): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", secret).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) | ((hmac[offset + 1]! & 0xff) << 16) | ((hmac[offset + 2]! & 0xff) << 8) | (hmac[offset + 3]! & 0xff);
  return String(binary % 10 ** digits).padStart(digits, "0");
}

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / STEP_SECONDS);

/**
 * Checks a 6-digit code, allowing one step of clock drift either way.
 * Returns the matching step (to block reuse of the same code), or null.
 */
export function verifyTotp(base32Secret: string, code: string, now = Date.now()): number | null {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const secret = base32Decode(base32Secret);
  const step = currentStep(now);
  for (const s of [step - 1, step, step + 1]) {
    const expected = Buffer.from(totpCode(secret, s));
    if (timingSafeEqual(expected, Buffer.from(clean))) return s;
  }
  return null;
}

// ── Encryption at rest ──────────────────────────────────────────────────────

/** True when SESSION_SECRET is long enough to protect two-factor secrets. */
export function hasServerSecret(): boolean {
  return (process.env.SESSION_SECRET ?? "").length >= 32;
}

function key(purpose: string): Buffer {
  const secret = process.env.SESSION_SECRET ?? "";
  if (secret.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters) to use two-factor sign-in.");
  return createHash("sha256").update(`${purpose}:${secret}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key("totp"), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}

/** Returns null if the value cannot be decrypted (e.g. SESSION_SECRET changed). */
export function decryptSecret(stored: string | null): string | null {
  if (!stored) return null;
  try {
    const [version, iv, tag, data] = stored.split(".");
    if (version !== "v1" || !iv || !tag || !data) return null;
    const decipher = createDecipheriv("aes-256-gcm", key("totp"), Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Signs a short value (the "password OK, waiting for code" cookie). */
export function sign(value: string): string {
  const mac = createHmac("sha256", key("login-2fa")).update(value).digest("base64url");
  return `${value}.${mac}`;
}

export function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  const mac = Buffer.from(signed.slice(i + 1));
  let expected: Buffer;
  try {
    expected = Buffer.from(createHmac("sha256", key("login-2fa")).update(value).digest("base64url"));
  } catch {
    return null;
  }
  return mac.length === expected.length && timingSafeEqual(mac, expected) ? value : null;
}

/** Link that authenticator apps understand (also usable as a QR code). */
export function otpauthUri(secret: string, accountEmail: string): string {
  const issuer = "Xpert Fintech";
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/** Codes already used, per admin, so a code cannot be replayed within its window. */
const lastUsedStep = new Map<string, number>();

export function consumeStep(adminId: string, step: number): boolean {
  const last = lastUsedStep.get(adminId);
  if (last !== undefined && step <= last) return false;
  lastUsedStep.set(adminId, step);
  return true;
}
