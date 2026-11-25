import type { EventItem } from "@/data/events";
import type { SeminarInfo } from "@/lib/seminars";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

async function get<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api${path}`, {
      headers: { "x-internal-key": INTERNAL_API_KEY },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getEvents(): Promise<EventItem[]> {
  return (await get<{ events: EventItem[] }>("/events"))?.events ?? [];
}

export async function getEvent(id: number): Promise<EventItem | null> {
  if (!Number.isInteger(id)) return null;
  return (await get<{ event: EventItem }>(`/events/${id}`))?.event ?? null;
}

export async function getSeminars(): Promise<SeminarInfo | null> {
  return get<SeminarInfo>("/membership/seminars");
}