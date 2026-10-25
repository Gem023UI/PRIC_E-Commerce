"use client";

import * as React from "react";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { TextReveal } from "@/components/motion/TextReveal";
import { anton } from "@/lib/fonts";

import {
  GOLD_GRADIENT,
  HEADING_STYLE,
  PLACEHOLDER_IMAGE,
} from "../home.data";

export default function QuickInfoSection() {
  const sectionRef = React.useRef<HTMLElement>(null);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative z-10 flex min-h-svh scroll-mt-24 items-center bg-black shadow-[0_-40px_60px_rgba(0,0,0,0.6)]"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-16">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PLACEHOLDER_IMAGE}
            alt="Ginger grown by PRIC member farmers"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div
            className="absolute -bottom-6 -right-2 rounded-2xl border border-[#784c0e]/35 px-6 py-3 text-center shadow-xl md:-right-8"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            <p
              className="text-4xl font-bold leading-none text-[#FFFFFF] md:text-5xl"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              20+
            </p>
            <p
              className="mt-1 text-xs font-bold leading-tight text-[#FFFFFF]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Years In Service to
              <br />
              the Community
            </p>
          </div>
        </div>

        <div>
          {/* Texts reveal once the section is about halfway into view. */}
          <TextReveal trigger={sectionRef} start="top 50%">
            <MetallicGoldText
              as="h2"
              className={anton.className}
              style={HEADING_STYLE}
            >
              Where Farmers Find the Community to Grow With.
            </MetallicGoldText>
          </TextReveal>
          <TextReveal
            variant="fade"
            trigger={sectionRef}
            start="top 50%"
            delay={0.25}
            className="mt-6"
          >
            <p className="max-w-md text-lg leading-snug md:text-xl">
              Established as a cooperative in 2004, PRIC-MPC has more than two
              decades of experience supporting local farmers and developing
              agricultural products in Pinagdanlayan, Dolores, Quezon
              Province.
            </p>
          </TextReveal>
        </div>
      </div>
    </section>
  );
}