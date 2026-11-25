import { RiderOrderPage } from "@/features/rider/RiderOrderPage";

export const metadata = { title: "Delivery" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RiderOrderPage id={id} />;
}