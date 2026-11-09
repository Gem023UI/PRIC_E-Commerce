"use client";

import * as React from "react";

export interface ImageSlideshowProps {
  images: string[];
  alt: string;
  /** ms between images. @default 2000 */
  interval?: number;
  /** Size / shape classes, e.g. "aspect-[4/3] w-full rounded-2xl". */
  className?: string;
}

/** Crossfading image slideshow. Pauses off screen; static for reduced motion. */
export default function ImageSlideshow({
  images,
  alt,
  interval = 4000,
  className = "",
}: ImageSlideshowProps) {
  const n = images.length;
  const [active, setActive] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const [reduced, setReduced] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!visible || reduced || n < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % n), interval);
    return () => clearInterval(id);
  }, [visible, reduced, n, interval]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      role="img"
      aria-label={alt}
    >
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: i === active ? 1 : 0,
            transition: reduced ? "none" : "opacity 1000ms ease-in-out",
          }}
        />
      ))}
    </div>
  );
}