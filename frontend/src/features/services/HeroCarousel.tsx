"use client";

import * as React from "react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Slide = { id: string; src: string; caption: string };

const INTERVAL_MS = 2000;

/** Circular position of item i relative to the active index (0 = centered). */
function relPos(i: number, active: number, n: number) {
  const offset = (((i - active) % n) + n) % n;
  return offset > n / 2 ? offset - n : offset;
}

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const n = slides.length;
  const reduced = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (paused || reduced || n < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, reduced, n]);

  const goTo = (i: number) => {
    if (i !== index) {
      setIndex(i);
      return;
    }
    document
      .getElementById(slides[i].id)
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Services"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative h-48 sm:h-60 md:h-72">
        {slides.map((s, i) => {
          const rel = relPos(i, index, n);
          const center = rel === 0;
          const hidden = Math.abs(rel) > 1;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={center ? `Go to ${s.caption}` : `Show ${s.caption}`}
              aria-hidden={hidden}
              tabIndex={hidden ? -1 : 0}
              className={cn(
                "absolute left-1/2 top-0 h-full w-[46%] rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#efc673]",
                center ? "z-10" : "z-0",
                hidden && "pointer-events-none",
              )}
              style={{
                transform: `translateX(calc(-50% + ${rel * 70}%)) scale(${center ? 1 : 0.65})`,
                opacity: hidden ? 0 : center ? 1 : 0.6,
                filter: center ? "none" : "brightness(0.45)",
                // No transition while wrapping behind the scenes, so it never visibly flies across.
                transition: hidden
                  ? "none"
                  : "transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms ease, filter 700ms ease",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.src}
                alt=""
                draggable={false}
                className="h-full w-full select-none object-contain"
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid text-center" aria-live="off">
        {slides.map((s, i) => (
          <p
            key={s.id}
            aria-hidden={i !== index}
            className={cn(
              "col-start-1 row-start-1 text-lg font-bold uppercase leading-snug transition-opacity duration-500 md:text-xl",
              i === index ? "opacity-100" : "opacity-0",
            )}
          >
            {s.caption}
          </p>
        ))}
      </div>
    </div>
  );
}