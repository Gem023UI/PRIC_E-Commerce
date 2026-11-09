import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { EventCard } from "@/components/ui/EventCard";
import { LATEST_EVENTS, UPCOMING_EVENTS } from "@/data/events";
import { anton } from "@/lib/fonts";

const titleStyle = {
  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
  lineHeight: 1.1,
} as const;

export default function EventsPage() {
  return (
    <PageShell>
      {/* Upcoming events */}
      <section className="mx-auto max-w-6xl px-6 pb-28 text-center">
        <MetallicGoldText
          as="h1"
          className={anton.className}
          style={titleStyle}
        >
          Upcoming Events
        </MetallicGoldText>

        <div className="mt-14 flex flex-wrap justify-center gap-x-14 gap-y-24">
          {UPCOMING_EVENTS.map((event, i) => (
            <Reveal
              key={event.id}
              delay={(i % 4) * 120}
              className="w-[16rem] max-w-full"
            >
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Latest events */}
      <section className="mx-auto max-w-6xl px-6 pb-36 text-center">
        <MetallicGoldText
          as="h2"
          className={anton.className}
          style={titleStyle}
        >
          Latest Events
        </MetallicGoldText>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-24 md:grid-cols-3 md:gap-x-14">
          {LATEST_EVENTS.map((event, i) => (
            <Reveal key={event.id} delay={(i % 3) * 120}>
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}