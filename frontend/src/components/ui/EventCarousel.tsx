"use client";

import * as React from "react";

import type { EventItem } from "@/data/events";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

export interface EventCarouselProps {
  events: EventItem[];
  /** ms between slides. @default 5000 */
  interval?: number;
}

export default function EventCarousel({
  events,
  interval = 5000,
}: EventCarouselProps) {
  const n = events.length;
  const [active, setActive] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const startX = React.useRef<number | null>(null);

  const go = React.useCallback(
    (d: number) => setActive((a) => (a + d + n) % n),
    [n],
  );

  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  React.useEffect(() => {
    if (paused || reduced || n < 2) return;
    const id = setInterval(() => go(1), interval);
    return () => clearInterval(id);
  }, [paused, reduced, n, interval, go]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Latest events"
      tabIndex={0}
      className="outline-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onPointerDown={(e) => {
        startX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        startX.current = null;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <div className="overflow-hidden">
        <div
          className="flex"
          style={{
            transform: `translateX(-${active * 100}%)`,
            transition: reduced
              ? "none"
              : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {events.map((event, i) => (
            <article
              key={event.id}
              className="shrink-0 grow-0 basis-full"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${n}`}
              aria-hidden={i !== active}
            >
              <div
                className="rounded-md p-[2px]"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                <div className="grid overflow-hidden rounded-[4px] bg-white text-black md:min-h-[340px] md:grid-cols-[2fr_3fr]">
                  <div className="relative aspect-[4/3] md:aspect-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image}
                      alt={event.title}
                      draggable={false}
                      className="absolute inset-0 h-full w-full select-none object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
                    <h3 className="text-2xl font-bold leading-tight md:text-3xl">
                      {event.title}
                    </h3>
                    <div className="text-base md:text-lg">
                      <p>{event.location}</p>
                      <p>{event.date}</p>
                    </div>
                    <p className="text-justify text-sm leading-relaxed md:text-base">
                      {event.description}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {events.map((event, i) => (
          <button
            key={event.id}
            type="button"
            aria-label={`Go to event ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
            onClick={() => setActive(i)}
            className={`h-5 w-5 rounded-full transition-colors duration-300 ${
              i === active ? "bg-white" : "bg-neutral-600 hover:bg-neutral-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}