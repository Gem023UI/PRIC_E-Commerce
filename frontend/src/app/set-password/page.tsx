import { SetPasswordPage } from "@/features/auth/SetPasswordPage";

export const metadata = { title: "Set your password | PRIC" };

type Params = Record<string, string | string[] | undefined>;
const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  return <SetPasswordPage token={pick(sp.token)} email={pick(sp.email).toLowerCase()} />;
}