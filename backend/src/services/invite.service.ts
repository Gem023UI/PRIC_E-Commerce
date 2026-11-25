import bcrypt from "bcryptjs";

import { env } from "../config/env";
import { PasswordSetup } from "../database/models/passwordSetup.model";
import { Session } from "../database/models/session.model";
import { User } from "../database/models/user.model";
import { randomToken, sha256 } from "../utils/crypto";
import { sendAccountInviteEmail } from "./mail.service";

const TTL_MS = 72 * 60 * 60 * 1000;

/** Creates a single-use "set your password" link for the email (replaces any earlier one). */
export async function createSetupToken(email: string): Promise<string> {
  const token = randomToken(32);
  await PasswordSetup.deleteMany({ email });
  await PasswordSetup.create({
    email,
    tokenHash: sha256(token),
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return `${env.FRONTEND_URL}/set-password?token=${token}&email=${encodeURIComponent(email)}`;
}

/** Creates the link and emails it. Throws if the email can't be sent. */
export async function sendInvite(user: { email: string; firstName: string; role: string }) {
  const url = await createSetupToken(user.email);
  await sendAccountInviteEmail(user.email, user.firstName, user.role, url);
}

export async function consumeSetup(
  email: string,
  token: string,
  password: string,
): Promise<"ok" | "invalid" | "expired"> {
  const doc = await PasswordSetup.findOne({ email, tokenHash: sha256(token) });
  if (!doc) return "invalid";

  if (doc.expiresAt < new Date()) {
    await PasswordSetup.deleteMany({ email });
    return "expired";
  }

  const user = await User.findOne({ email, status: { $ne: "deactivated" } });
  if (!user) {
    await PasswordSetup.deleteMany({ email });
    return "invalid";
  }

  user.set("passwordHash", await bcrypt.hash(password, 12));
  user.emailVerified = user.emailVerified ?? new Date(); // opening the emailed link proves the email
  user.status = "verified";
  await user.save();

  await Session.deleteMany({ userId: user._id }); // a new password signs out older sessions
  await PasswordSetup.deleteMany({ email });
  return "ok";
}