"use client";

import * as React from "react";

type EventGalleryProps = {
  images: string[];
  alt: string;
  /** Time each picture stays on screen, in ms. @default 4000 */
  interval?: number;
};

/** Pictures stacked in place; the active one fades in over the others. */
export function EventGallery({ images, alt, interval = 4000 }: EventGalleryProps) {
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    if (images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % images.length),
      interval,
    );
    return () => window.clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-xl">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`${alt} (${i + 1} of ${images.length})`}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

export default EventGallery;