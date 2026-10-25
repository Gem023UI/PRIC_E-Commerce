"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { TextReveal } from "@/components/motion/TextReveal";
import { anton } from "@/lib/fonts";

import { BRAND_LOGO, GOLD_GRADIENT, HEADING_STYLE } from "../home.data";

gsap.registerPlugin(ScrollTrigger);

// Fraction of the pinned scroll spent sliding the picture from centre to the
// left. The text reveals right after it.
const SLIDE_END = 0.4;

export default function BrandSection() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    const image = imageRef.current;
    if (!section || !grid || !image) return;

    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 768px)",
      () => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        // offsetLeft/offsetWidth are layout values, unaffected by the transform
        tl.fromTo(
          image,
          { x: () => grid.clientWidth / 2 - (image.offsetLeft + image.offsetWidth / 2) },
          { x: 0, duration: SLIDE_END },
          0,
        );
        tl.to({}, { duration: 1 - SLIDE_END }, SLIDE_END);
      },
      section,
    );

    return () => mm.revert();
  }, []);

  const textStart = () => {
    const section = sectionRef.current;
    if (!section || window.innerWidth < 768) return "top 70%";
    const scrollable = Math.max(0, section.offsetHeight - window.innerHeight);
    return `top+=${Math.round(scrollable * (SLIDE_END + 0.02))} top`;
  };

  return (
    <section
      id="brand"
      ref={sectionRef}
      className="relative z-10 bg-black md:h-[320vh]"
    >
      <div className="md:sticky md:top-0 md:flex md:h-svh md:items-center md:overflow-hidden">
        <div
          ref={gridRef}
          className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-16 md:py-0"
        >
          <div ref={imageRef} className="will-change-transform">
            <div
              className="rounded-2xl p-[3px] shadow-xl"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_LOGO}
                alt="Hillside Food Products logo"
                className="aspect-[4/3] w-full rounded-[13px] bg-black object-cover"
              />
            </div>
          </div>

          <div>
            <TextReveal trigger={sectionRef} start={textStart}>
              <MetallicGoldText
                as="h2"
                className={anton.className}
                style={HEADING_STYLE}
              >
                Hillside Food Products Inc.
              </MetallicGoldText>
            </TextReveal>
            <TextReveal
              variant="fade"
              trigger={sectionRef}
              start={textStart}
              delay={0.25}
              className="mt-6"
            >
              <p className="max-w-md text-lg leading-snug md:text-xl">
                Specializing in value-added products made from locally sourced
                agricultural ingredients, its products include ginger and
                turmeric-based beverages, flavored ginger brews, and other
                processed food products, helping PRIC-MPC turn local farm
                produce into marketable products and additional livelihood
                opportunities for its cooperative members.
              </p>
            </TextReveal>
          </div>
        </div>
      </div>
    </section>
  );
}