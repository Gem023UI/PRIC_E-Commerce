"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import ProductCarousel from "@/components/ui/ProductCarousel";
import { anton } from "@/lib/fonts";

import { HEADING_STYLE, PRODUCTS } from "../home.data";

gsap.registerPlugin(ScrollTrigger);

// Pinned timeline (0..1):
//   0 -> 0.4      header scales from 50vw wide down to its normal size, centred
//   0.45 -> 0.65  carousel fades in
//   0.65 -> 1     rest, then the pin releases
const TITLE_START_VW = 50;
const TITLE_END = 0.4;
const CAROUSEL_AT = 0.45;
const CAROUSEL_DUR = 0.2;

export default function ProductsSection() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const carousel = carouselRef.current;
    if (!section || !title || !carousel) return;

    const ctx = gsap.context(() => {
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

      // offsetWidth is the layout width at the normal font size (scale-proof)
      tl.fromTo(
        title,
        {
          scale: () =>
            Math.max(1, (window.innerWidth * TITLE_START_VW) / 100 / title.offsetWidth),
        },
        { scale: 1, duration: TITLE_END },
        0,
      );
      tl.fromTo(
        carousel,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: CAROUSEL_DUR },
        CAROUSEL_AT,
      );
      tl.to({}, { duration: 1 - (CAROUSEL_AT + CAROUSEL_DUR) }, CAROUSEL_AT + CAROUSEL_DUR);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="products"
      ref={sectionRef}
      className="relative z-10 h-[260vh] bg-black"
    >
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center gap-10 overflow-hidden">
        <div ref={titleRef} className="w-fit origin-center will-change-transform">
          <MetallicGoldText
            as="h2"
            className={anton.className}
            style={HEADING_STYLE}
          >
            OUR PRODUCTS
          </MetallicGoldText>
        </div>
        <div ref={carouselRef} className="w-full">
          <ProductCarousel items={PRODUCTS} />
        </div>
      </div>
    </section>
  );
}