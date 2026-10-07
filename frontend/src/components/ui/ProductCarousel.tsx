"use client";

import * as React from "react";

export interface ProductCarouselItem {
  image: string;
  alt?: string;
}

export interface ProductCarouselProps {
  items: ProductCarouselItem[];
  autoplay?: boolean;
  /** ms between auto-advances. @default 3500 */
  interval?: number;
  className?: string;
}

const GAP = 28; // px between items
const SIDE_SCALE = 0.7;
const VISIBLE = 2; // items shown on each side of the center

export default function ProductCarousel({
  items,
  autoplay = true,
  interval = 3500,
  className = "",
}: ProductCarouselProps) {
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
    const expr = `${mult} * var(--pc-s) + ${abs * GAP}px`;
    return off < 0 ? `calc(-1 * (${expr}))` : `calc(${expr})`;
  };

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

  return (
    <div
      className={`relative w-full select-none overflow-hidden outline-none ${className}`}
      style={
        {
          "--pc-s": "clamp(200px, 60vw, 324px)",
          height: "calc(var(--pc-s) + 48px)",
          touchAction: "pan-y",
        } as React.CSSProperties
      }
      role="region"
      aria-roledescription="carousel"
      aria-label="Our products"
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
            className="absolute left-1/2 top-1/2 overflow-hidden rounded-2xl"
            style={{
              width: "var(--pc-s)",
              height: "var(--pc-s)",
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
              alt={item.alt ?? `Product ${i + 1}`}
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>
        );
      })}
    </div>
  );
}