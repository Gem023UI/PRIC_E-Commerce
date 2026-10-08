import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { toNotice } from "@/lib/auth-notice";

export const metadata = { title: "Login | PRIC" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await auth()) redirect("/");
  const sp = await searchParams;
  return <AuthCard initialMode="login" notice={toNotice(sp)} />;
}