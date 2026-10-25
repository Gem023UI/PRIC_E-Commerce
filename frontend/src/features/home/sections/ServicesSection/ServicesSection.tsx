"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { useFitTitle } from "@/components/motion/UseFitTitle";
import { anton } from "@/lib/fonts";
import { SERVICES } from "@/features/home/home.data";

import ServiceCard from "./ServiceCard";
import "./ServicesSection.css";

gsap.registerPlugin(ScrollTrigger);

// One pinned viewport (timeline normalised to 0..1):
//   0 -> 0.25     OUR SERVICES settles from 90vw to 80vw at the centre (cards hidden)
//   0.25 -> 0.85  cards fade in at the right edge, pan right -> left; the last
//                 card stops flush inside the viewport
//   0.85 -> 1     REST: title + cards sit still, then the pin releases and the
//                 section scrolls away
const TITLE_SETTLED_VW = 80;
const TITLE_INTRO_VW = 90;
const TITLE_SETTLED_OPACITY = 0.25;
const TITLE_END = 0.25;
const PAN_END = 0.85;
const SCROLL_VH = 520; // extra scroll distance the section stays pinned for

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useFitTitle(
    titleRef,
    TITLE_SETTLED_VW,
    `100px ${anton.style.fontFamily}`,
  );

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !title || !viewport || !track) return;

    const ctx = gsap.context(() => {
      const pad = () => parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      // last card's right edge lands exactly at the viewport's inner right edge
      const maxX = () =>
        Math.max(0, track.scrollWidth - (viewport.clientWidth - 2 * pad()));
      // cards start at the real right edge of the window
      const startX = () =>
        window.innerWidth - (viewport.getBoundingClientRect().left + pad());

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=" + SCROLL_VH + "%",
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        title,
        { scale: TITLE_INTRO_VW / TITLE_SETTLED_VW, opacity: 0.95 },
        { scale: 1, opacity: TITLE_SETTLED_OPACITY, duration: TITLE_END },
        0,
      );
      tl.fromTo(track, { opacity: 0 }, { opacity: 1, duration: 0.06 }, TITLE_END);
      tl.fromTo(
        track,
        { x: startX },
        { x: () => -maxX(), duration: PAN_END - TITLE_END },
        TITLE_END,
      );
      tl.to({}, { duration: 1 - PAN_END }, PAN_END); // rest before the pin releases
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="services"
      aria-label="Our services"
      style={{ height: `${100 + SCROLL_VH}vh` }}
    >
      <div className="services__stick">
        <div
          ref={titleRef}
          className={`services__title ${anton.className}`}
          aria-hidden="true"
        >
          OUR SERVICES
        </div>

        <div className="services__viewport" ref={viewportRef}>
          <div className="services__track" ref={trackRef}>
            {SERVICES.map((s) => (
              <ServiceCard
                key={s.label}
                label={s.label}
                description={s.description}
                image={s.image}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}