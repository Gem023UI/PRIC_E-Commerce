import { NextResponse } from "next/server";

import { appUrl, consumeVerification } from "@/lib/verification";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email")?.toLowerCase();

  const go = (query: string) =>
    NextResponse.redirect(`${appUrl()}/login?${query}`);

  if (!token || !email) return go("verified=0&reason=invalid");

  const result = await consumeVerification(email, token);
  if (result === "ok") return go("verified=1");
  return go(`verified=0&reason=${result}`);
}