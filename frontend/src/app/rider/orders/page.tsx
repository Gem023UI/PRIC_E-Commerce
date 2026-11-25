import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";

export const metadata = { title: "My deliveries | PRIC" };

export default function RiderOrders() {
  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-6 pb-28">
        <MetallicGoldText as="h1" fold={false} className="text-3xl font-bold uppercase md:text-5xl">
          My Deliveries
        </MetallicGoldText>
        <p className="mt-4 text-white/70">
          You&apos;re signed in as a rider. Your assigned deliveries arrive in Phase 6.
        </p>
      </section>
    </PageShell>
  );
}