import PageShell from "@/components/layout/pageshell";
import { OrdersPage } from "@/features/orders/OrdersPage";

export const metadata = { title: "My Orders | PRIC" };

export default function Page() {
  return (
    <PageShell>
      <OrdersPage />
    </PageShell>
  );
}