import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import clientPromise, { ensureIndexes } from "@/lib/mongodb";
import { fieldErrors, registerSchema } from "@/lib/auth-schema";
import { issueVerification } from "@/lib/verification";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: fieldErrors(parsed.error.issues) },
      { status: 400 },
    );
  }

  const { firstName, lastName, mobile, email, password } = parsed.data;

  await ensureIndexes();
  const users = (await clientPromise).db().collection("users");

  const existing = await users.findOne({ email });
  if (existing && (existing.emailVerified || !existing.passwordHash)) {
    return NextResponse.json(
      {
        errors: {
          email: existing.passwordHash
            ? "An account with this email already exists"
            : "This email is already linked to a Google or Facebook sign-in",
        },
      },
      { status: 409 },
    );
  }

  const profile = {
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    mobile,
    passwordHash: await bcrypt.hash(password, 12),
    termsAcceptedAt: new Date(),
  };

  try {
    if (existing) {
      // Unverified earlier attempt: let the user retry with new details.
      await users.updateOne({ email }, { $set: profile });
    } else {
      await users.insertOne({
        ...profile,
        email,
        emailVerified: null,
        image: null,
        createdAt: new Date(),
      });
    }
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json(
        { errors: { email: "An account with this email already exists" } },
        { status: 409 },
      );
    }
    throw err;
  }

  try {
    await issueVerification(email, firstName);
  } catch (err) {
    console.error("[register] verification email failed", err);
    return NextResponse.json(
      {
        errors: {
          form: "We couldn't send the verification email. Please try again.",
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}