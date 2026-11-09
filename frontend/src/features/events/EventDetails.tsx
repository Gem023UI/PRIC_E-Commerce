import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import type { EventItem } from "@/data/events";
import { anton } from "@/lib/fonts";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Clock01Icon,
  Location04Icon,
} from "@hugeicons/core-free-icons";
import { EventGallery } from "@/features/events/EventGallery";

const titleStyle = {
  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
  lineHeight: 1.1,
} as const;

const eventTitleStyle = {
  fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
  lineHeight: 1.15,
} as const;

export default function EventDetailsPage({ event }: { event: EventItem }) {
  const details = [
    { Icon: Calendar03Icon, text: event.date },
    { Icon: Clock01Icon, text: event.time },
    { Icon: Location04Icon, text: event.location },
  ];

  return (
    <PageShell>
      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pb-12 text-center">
        <MetallicGoldText
          as="h1"
          className={anton.className}
          style={titleStyle}
        >
          PRIC Events
        </MetallicGoldText>
      </section>

      {/* Hero: pictures left, details right */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 md:grid-cols-2 md:gap-14">
        <Reveal>
          <EventGallery images={event.images} alt={event.title} />
        </Reveal>

        <div>
          <MetallicGoldText
            as="h2"
            className={anton.className}
            style={eventTitleStyle}
          >
            {event.title}
          </MetallicGoldText>

          <ul className="mt-8 space-y-4">
            {details.map(({ Icon, text }, i) => (
              <Reveal as="li" key={i} delay={150 + i * 120}>
                <div className="flex items-start gap-4">
                <HugeiconsIcon
                icon={Icon}
                size={24}
                className="mt-0.5 shrink-0 text-[#f4d587]"
                strokeWidth={1.8}
                />                  
                <span className="text-base leading-snug md:text-lg">{text}</span>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Description */}
      <section className="mx-auto max-w-4xl px-6 pb-28">
        <Reveal>
          <p className="text-justify text-base leading-relaxed md:text-lg">
            {event.description}
          </p>
        </Reveal>
      </section>
    </PageShell>
  );
}