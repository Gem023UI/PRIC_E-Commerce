import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}