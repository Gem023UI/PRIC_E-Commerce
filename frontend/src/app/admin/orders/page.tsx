import { OrdersPage } from "@/features/admin/OrdersPage";
import { parseRange } from "@/lib/admin-stats";

export const metadata = { title: "Orders" };

export default async function AdminOrdersRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  return <OrdersPage initialRange={parseRange(raw)} />;
}