import { notFound } from "next/navigation";

import { EVENTS, getEventById } from "@/data/events";
import EventDetailsPage from "@/features/events/EventDetails";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: String(e.id) }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = getEventById(Number(id));
  if (!event) notFound();
  return <EventDetailsPage event={event} />;
}