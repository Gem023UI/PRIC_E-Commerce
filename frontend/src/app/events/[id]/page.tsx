import { notFound } from "next/navigation";

import EventDetailsPage from "@/features/events/EventDetails";
import { getEvent } from "@/lib/content-api";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(Number(id));
  if (!event) notFound();
  return <EventDetailsPage event={event} />;
}