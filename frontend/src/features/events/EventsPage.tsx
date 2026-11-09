import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { EVENTS } from "@/data/events";
import { anton } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";

const titleStyle = {
  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
  lineHeight: 1.1,
} as const;

export default function EventsPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 pb-16 text-center">
        <MetallicGoldText
          as="h1"
          className={anton.className}
          style={titleStyle}
        >
          Latest Events
        </MetallicGoldText>
        <Reveal delay={150}>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-snug md:text-xl">
            Highlights from the events and programs PRIC-MPC takes part in to
            promote local farmers and bring community produce to wider markets.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl space-y-10 px-6 pb-28">
        {EVENTS.map((event) => (
          <Reveal key={event.id}>
            <article
              className="rounded-md p-[2px]"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              <div className="grid overflow-hidden rounded-[4px] bg-white text-black md:min-h-[340px] md:grid-cols-[2fr_3fr]">
                <div className="relative aspect-[4/3] md:aspect-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.image}
                    alt={event.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                  <h2 className="text-2xl font-bold leading-tight md:text-3xl">
                    {event.title}
                  </h2>
                  <div className="text-base md:text-lg">
                    <p>{event.location}</p>
                    <p>{event.date}</p>
                  </div>
                  <p className="text-justify text-sm leading-relaxed md:text-base">
                    {event.description}
                  </p>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </PageShell>
  );
}