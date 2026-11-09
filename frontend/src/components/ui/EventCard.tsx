import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, Location04Icon } from "@hugeicons/core-free-icons";
import type { EventItem } from "@/data/events";
import { cn } from "@/lib/utils";

type EventCardProps = {
  event: EventItem;
  className?: string;
};

export function EventCard({ event, className }: EventCardProps) {
  return (
    <article
      className={cn(
        "relative z-0 mx-auto flex w-full max-w-[16rem] flex-col overflow-hidden rounded-3xl bg-white text-black shadow-xl transition-transform duration-300 ease-out hover:z-20 hover:scale-150",
        className,
      )}
    >
      <div className="aspect-[4/3] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.image}
          alt={event.title}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-3 flex min-h-[3.75rem] items-center justify-center text-center text-sm font-bold uppercase leading-tight">
          {event.title}
        </h3>

        <p className="flex items-start gap-2 text-xs leading-snug">
          <HugeiconsIcon icon={Calendar03Icon} className="mt-px size-5 shrink-0" />
          <span className="line-clamp-2">{event.date}</span>
        </p>
        <p className="flex items-start gap-2 text-xs leading-snug">
          <HugeiconsIcon icon={Location04Icon} className="mt-px size-5 shrink-0" />
          <span className="line-clamp-2">{event.location}</span>
        </p>

        <Link
          href={`/events/${event.id}`}
          className="mt-auto block rounded-lg bg-black py-2 text-center text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-neutral-800"
        >
          See Event
        </Link>
      </div>
    </article>
  );
}

export default EventCard;