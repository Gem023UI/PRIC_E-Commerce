import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { EventCard } from "@/components/ui/EventCard";
import { getEvents } from "@/lib/content-api";
import { anton } from "@/lib/fonts";

const titleStyle = {
  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
  lineHeight: 1.1,
} as const;

export default async function EventsPage() {
  const events = await getEvents();
  const upcoming = events.filter((e) => e.status === "upcoming");
  const latest = events.filter((e) => e.status === "latest");
  
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

        {upcoming.length === 0 && (
          <p className="mt-12 text-lg text-white/70">No upcoming events right now. Check back soon.</p>
        )}

        <div className="mt-14 flex flex-wrap justify-center gap-x-14 gap-y-24">
          {upcoming.map((event, i) => (
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

        {latest.length === 0 && (
          <p className="mt-12 text-lg text-white/70">No events to show yet.</p>
        )}

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-24 md:grid-cols-3 md:gap-x-14">
          {latest.map((event, i) => (
            <Reveal key={event.id} delay={(i % 3) * 120}>
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}