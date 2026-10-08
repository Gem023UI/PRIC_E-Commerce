import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { toNotice } from "@/lib/auth-notice";

export const metadata = { title: "Register | PRIC" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await auth()) redirect("/");
  const sp = await searchParams;
  return <AuthCard initialMode="register" notice={toNotice(sp)} />;
}