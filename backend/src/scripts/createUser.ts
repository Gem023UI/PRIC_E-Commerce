import bcrypt from "bcryptjs";

import { connectDatabase, disconnectDatabase } from "../database/connection";
import { USER_ROLES, User, type UserRole } from "../database/models/user.model";
import { createSetupToken } from "../services/invite.service";
import { sendAccountInviteEmail } from "../services/mail.service";

const USAGE = `Usage:
  pnpm user:create --email <email> --first <name> [--last <name>] [--role admin|rider|customer] [--mobile 09XXXXXXXXX] [--password <password>]

With --password the account is ready to log in. Without it, an invitation email
with a set-password link (valid 72 hours) is sent instead.`;

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const firstName = arg("first")?.trim();
  const lastName = arg("last")?.trim() ?? "";
  const role = (arg("role") ?? "customer") as UserRole;
  const mobileRaw = arg("mobile")?.replace(/[\s().-]/g, "");
  const password = arg("password");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !firstName) fail(USAGE);
  if (!USER_ROLES.includes(role)) fail(`Role must be one of: ${USER_ROLES.join(", ")}`);

  let mobile: string | undefined;
  if (mobileRaw) {
    if (!/^(?:\+639|639|09)\d{9}$/.test(mobileRaw)) fail("Invalid PH mobile number.");
    mobile = `+63${mobileRaw.slice(-10)}`;
  }

  if (password && !(password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password))) {
    fail("Password needs 8+ characters with an uppercase letter, a lowercase letter and a number.");
  }

  await connectDatabase();

  if (await User.exists({ email })) fail(`An account for ${email} already exists.`);

  await User.create({
    firstName,
    lastName,
    email,
    role,
    status: "verified",
    emailVerified: new Date(),
    ...(mobile ? { mobile } : {}),
    ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
  });
  console.log(`Created ${role} account for ${email}.`);

  if (!password) {
    const url = await createSetupToken(email);
    try {
      await sendAccountInviteEmail(email, firstName, role, url);
      console.log(`Invitation emailed to ${email}.`);
    } catch (err) {
      console.error("Could not send the invitation email:", err instanceof Error ? err.message : err);
      console.log(`Share this link instead (valid 72 hours):\n${url}`);
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());