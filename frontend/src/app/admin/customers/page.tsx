import { CustomersPage } from "@/features/admin/CustomersPage";
import { parseRange } from "@/lib/admin-stats";

export const metadata = { title: "Customers" };

export default async function AdminCustomersRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  return <CustomersPage initialRange={parseRange(raw)} />;
}