import { redirect } from "next/navigation";

import { AuthCard } from "@/features/auth/auth-card";
import { toNotice } from "@/lib/auth-notice";
import { homeForRole } from "@/lib/roles";
import { getSession } from "@/lib/session";

export const metadata = { title: "Login | PRIC" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSession();
  if (user) redirect(homeForRole(user.role));
  const sp = await searchParams;
  return <AuthCard notice={toNotice(sp)} />;
}