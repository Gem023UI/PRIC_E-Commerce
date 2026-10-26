"use client";

import * as React from "react";

export interface ServiceCarouselItem {
  image: string;
  title: string;
  description: string;
  alt?: string;
}

export interface ServiceCarouselProps {
  items: ServiceCarouselItem[];
  autoplay?: boolean;
  /** ms between auto-advances. @default 5000 */
  interval?: number;
  className?: string;
}

const GAP = 64; // px between items
const SIDE_SCALE = 0.8;
const VISIBLE = 1; // items shown on each side of the center
const RATIO = 0.5625; // item height / width (16:9)

export default function ServiceCarousel({
  items,
  autoplay = true,
  interval = 5000,
  className = "",
}: ServiceCarouselProps) {
  const n = items.length;
  const [active, setActive] = React.useState(0);
  const [dir, setDir] = React.useState<1 | -1>(1);
  const [paused, setPaused] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const drag = React.useRef<{ x: number } | null>(null);
  const suppressClick = React.useRef(false);

  const go = React.useCallback(
    (d: 1 | -1) => {
      setDir(d);
      setActive((a) => (a + d + n) % n);
    },
    [n],
  );

  const goTo = (i: number, off: number) => {
    setDir(off > 0 ? 1 : -1);
    setActive(i);
  };

  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  React.useEffect(() => {
    if (!autoplay || paused || reduced || n < 2) return;
    const id = setInterval(() => go(1), interval);
    return () => clearInterval(id);
  }, [autoplay, paused, reduced, n, interval, go]);

  if (n === 0) return null;

  // Signed distance from the active item. The wrap point flips with the
  // travel direction so items leaving the screen keep moving outward.
  const offsetOf = (i: number) => {
    let d = (((i - active) % n) + n) % n;
    if (dir === 1 ? d >= n / 2 : d > n / 2) d -= n;
    return d;
  };

  const xFor = (off: number) => {
    const abs = Math.abs(off);
    if (abs === 0) return "0px";
    const mult = 0.5 + SIDE_SCALE * 0.5 + SIDE_SCALE * (abs - 1);
    const expr = `${mult} * var(--sc-w) + ${abs * GAP}px`;
    return off < 0 ? `calc(-1 * (${expr}))` : `calc(${expr})`;
  };

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const current = items[active];

  return (
    <div
      className={`w-full select-none outline-none ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Services"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(1);
        if (e.key === "ArrowLeft") go(-1);
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX };
        suppressClick.current = false;
      }}
      onPointerUp={(e) => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.x;
        drag.current = null;
        if (Math.abs(dx) > 50) {
          suppressClick.current = true;
          go(dx < 0 ? 1 : -1);
        }
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      style={{ touchAction: "pan-y" }}
    >
      {/* Stage: full-bleed so the side pictures run off the screen edges */}
      <div
        className="relative w-full overflow-hidden"
        style={
          {
            "--sc-w": "clamp(240px, 42vw, 520px)",
            height: `calc(var(--sc-w) * ${RATIO} + 8px)`,
          } as React.CSSProperties
        }
      >
        {items.map((item, i) => {
          const off = offsetOf(i);
          const abs = Math.abs(off);
          const visible = abs <= VISIBLE;
          const transition = reduced
            ? "none"
            : `transform 700ms ${ease}, opacity 700ms ${ease}`;

          return (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 overflow-hidden"
              style={{
                width: "var(--sc-w)",
                height: `calc(var(--sc-w) * ${RATIO})`,
                transform: `translate(-50%, -50%) translateX(${xFor(off)}) scale(${abs === 0 ? 1 : SIDE_SCALE})`,
                opacity: visible ? 1 : 0,
                zIndex: 10 - abs,
                pointerEvents: visible ? "auto" : "none",
                cursor: off === 0 ? "default" : "pointer",
                transition,
              }}
              aria-hidden={!visible}
              onClick={() => {
                if (suppressClick.current) return;
                if (off !== 0) goTo(i, off);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.alt ?? item.title}
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Text for the picture currently in the middle */}
      <div className="mx-auto mt-8 max-w-xl px-6 text-center" aria-live="polite">
        <div
          key={active}
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
        >
          <h3 className="text-lg font-bold uppercase tracking-wide md:text-xl">
            {current.title}
          </h3>
          <p className="mt-3 text-base leading-snug text-white/90 md:text-lg">
            {current.description}
          </p>
        </div>
      </div>
    </div>
  );
}