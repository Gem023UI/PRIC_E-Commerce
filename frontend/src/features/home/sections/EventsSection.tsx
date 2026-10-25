import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import EventCarousel from "@/components/ui/EventCarousel";
import { EVENTS } from "@/data/events";
import { anton } from "@/lib/fonts";

import { HEADING_STYLE } from "../home.data";

export default function EventsSection() {
  return (
    <section
      id="events"
      className="relative z-10 scroll-mt-24 overflow-x-clip bg-black"
    >
      <div className="mx-auto max-w-6xl px-6 pb-28 pt-12">
        <TextReveal>
          <MetallicGoldText
            as="h2"
            className={anton.className}
            style={HEADING_STYLE}
          >
            LATEST EVENTS
          </MetallicGoldText>
        </TextReveal>
        <Reveal delay={150} className="mt-10">
          <EventCarousel events={EVENTS} />
        </Reveal>
      </div>
    </section>
  );
}