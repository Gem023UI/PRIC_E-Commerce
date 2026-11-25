import { OverviewPage } from "@/features/admin/OverviewPage";
import { parseRange } from "@/lib/admin-stats";

export const metadata = { title: "Overview" };

export default async function AdminOverviewRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  return <OverviewPage initialRange={parseRange(raw)} />;
}