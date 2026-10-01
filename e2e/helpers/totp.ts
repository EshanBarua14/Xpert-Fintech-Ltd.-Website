import { createHmac } from "node:crypto";

/** RFC 6238 codes, same as the site's (6 digits, 30 s, SHA-1). Test use only. */
function base32Decode(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of input.toUpperCase().replace(/[\s=-]/g, "")) {
    value = (value << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const currentStep = () => Math.floor(Date.now() / 30_000);

export function totp(secret: string, step = currentStep()) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const o = h[h.length - 1]! & 15;
  const bin = ((h[o]! & 127) << 24) | (h[o + 1]! << 16) | (h[o + 2]! << 8) | h[o + 3]!;
  return String(bin % 1_000_000).padStart(6, "0");
}

/** Waits until a new 30-second step starts (codes can only be used once). */
export async function nextStep(after: number) {
  while (currentStep() <= after) await new Promise((r) => setTimeout(r, 1000));
  return currentStep();
}
