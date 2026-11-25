import { EngagementPage } from "@/features/admin/EngagementPage";
import { parseRange } from "@/lib/admin-stats";
import type { Tab } from "@/lib/admin-engagement";

export const metadata = { title: "Cooperative engagement" };

const TABS: Tab[] = ["inquiries", "membership", "events", "announcements"];

export default async function AdminEngagementRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const tab = TABS.find((t) => t === pick(sp.tab)) ?? "inquiries";
  return <EngagementPage initialRange={parseRange(pick(sp.range))} initialTab={tab} />;
}   