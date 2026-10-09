import { env } from "../src/config/env";
import { EmailVerification } from "../src/database/models/emailVerification.model";
import { User } from "../src/database/models/user.model";
import { randomToken, sha256 } from "../src/utils/crypto";
import { sendVerificationEmail } from "./mail.service";

const TTL_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;

/** Emails a fresh link. Returns false when throttled (one email per minute). */
export async function issueVerification(email: string, firstName: string) {
  const recent = await EmailVerification.exists({
    email,
    createdAt: { $gt: new Date(Date.now() - COOLDOWN_MS) },
  });
  if (recent) return false;

  const token = randomToken(32);
  await EmailVerification.deleteMany({ email });
  await EmailVerification.create({
    email,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + TTL_MS),
  });

  const url = `${env.FRONTEND_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  await sendVerificationEmail(email, firstName, url);
  return true;
}

export async function consumeVerification(
  email: string,
  token: string,
): Promise<"ok" | "invalid" | "expired"> {
  const doc = await EmailVerification.findOne({
    email,
    tokenHash: sha256(token),
  });
  if (!doc) return "invalid";

  await EmailVerification.deleteMany({ email });
  if (doc.expiresAt < new Date()) return "expired";

  await User.updateOne({ email }, { $set: { emailVerified: new Date() } });
  return "ok";
}