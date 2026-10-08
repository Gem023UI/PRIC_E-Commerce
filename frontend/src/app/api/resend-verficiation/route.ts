import { NextResponse } from "next/server";

import clientPromise from "@/lib/mongodb";
import { emailOnlySchema } from "@/lib/auth-schema";
import { issueVerification } from "@/lib/verification";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = emailOnlySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await (await clientPromise)
    .db()
    .collection("users")
    .findOne({ email, passwordHash: { $exists: true }, emailVerified: null });

  if (user) {
    try {
      await issueVerification(email, user.firstName ?? "there");
    } catch (err) {
      console.error("[resend] verification email failed", err);
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  }

  // Same response whether or not the account exists.
  return NextResponse.json({ ok: true });
}