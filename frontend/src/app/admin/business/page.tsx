import { BusinessPage } from "@/features/admin/BusinessPage";
import { parseRange } from "@/lib/admin-stats";

export const metadata = { title: "Business performance" };

export default async function AdminBusinessRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  return <BusinessPage initialRange={parseRange(raw)} />;
}