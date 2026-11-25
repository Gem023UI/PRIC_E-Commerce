import { randomInt } from "node:crypto";

import { env } from "../config/env";

// No 0/O/1/I so codes are easy to read aloud and type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** PRIC-YYYYMMDD-XXXXXX (date in Philippine time). */
export function generateTrackingCode(now = new Date()): string {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .replace(/-/g, "");
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += ALPHABET[randomInt(ALPHABET.length)];
  return `PRIC-${ymd}-${suffix}`;
}

/** The URL encoded in the QR code (the rider app will scan this later). */
export const trackingUrl = (code: string) =>
  `${env.FRONTEND_URL}/orders/track/${encodeURIComponent(code)}`;