import { InventoryPage } from "@/features/admin/InventoryPage";
import { parseRange } from "@/lib/admin-stats";

export const metadata = { title: "Products & inventory" };

export default async function AdminProductsRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  return <InventoryPage initialRange={parseRange(raw)} />;
}