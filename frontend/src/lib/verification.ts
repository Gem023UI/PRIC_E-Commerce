import { createHash, randomBytes } from "node:crypto";

import clientPromise, { ensureIndexes } from "@/lib/mongodb";
import { sendVerificationEmail } from "@/lib/mailer";

const TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export const appUrl = () =>
  (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

/** Creates a token and emails the link. Returns false if throttled. */
export async function issueVerification(email: string, firstName: string) {
  await ensureIndexes();
  const db = (await clientPromise).db();
  const col = db.collection("email_verifications");

  const recent = await col.findOne({
    email,
    createdAt: { $gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
  });
  if (recent) return false;

  const token = randomBytes(32).toString("hex");
  await col.deleteMany({ email });
  await col.insertOne({
    email,
    tokenHash: hashToken(token),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  const url = `${appUrl()}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  await sendVerificationEmail(email, firstName, url);
  return true;
}

export async function consumeVerification(
  email: string,
  token: string,
): Promise<"ok" | "invalid" | "expired"> {
  const db = (await clientPromise).db();
  const col = db.collection("email_verifications");

  const doc = await col.findOne({ email, tokenHash: hashToken(token) });
  if (!doc) return "invalid";

  await col.deleteMany({ email });
  if (doc.expiresAt < new Date()) return "expired";

  await db
    .collection("users")
    .updateOne({ email }, { $set: { emailVerified: new Date() } });
  return "ok";
}