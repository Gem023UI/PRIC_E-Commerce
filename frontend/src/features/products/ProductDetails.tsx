"use client";

import * as React from "react";
import gsap from "gsap";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import type { ProductItem } from "@/data/products";
import { poppins } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ProductDetailProps = {
  product: ProductItem;
  /** Where the product image was on the grid when it was clicked. */
  fromRect: DOMRect;
  /** Current position of the grid thumbnail, used to fly back to it. */
  getReturnRect: (id: number) => DOMRect | null;
  /** Called once the close animation has finished. */
  onClosed: () => void;
};

/**
 * Full-screen product screen. The product image is animated from the grid
 * thumbnail to its place here (and back) with a FLIP-style transform, while
 * the background image fades in place.
 */
export function ProductDetail({
  product,
  fromRect,
  getReturnRect,
  onClosed,
}: ProductDetailProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLDivElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const closing = React.useRef(false);

  // Open: image flies from the thumbnail to its final spot, bg fades in.
  React.useLayoutEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const dst = img.getBoundingClientRect();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        bgRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.7, ease: "power2.out" },
      );
      gsap.fromTo(
        img,
        {
          x: fromRect.left - dst.left,
          y: fromRect.top - dst.top,
          scale: fromRect.width / dst.width,
          transformOrigin: "0 0",
        },
        { x: 0, y: 0, scale: 1, duration: 0.8, ease: "power3.inOut" },
      );
      gsap.fromTo(
        closeRef.current,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.4, delay: 0.5, ease: "power2.out" },
      );
    }, rootRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close: image flies back to the thumbnail, everything else fades out.
  const close = React.useCallback(() => {
    if (closing.current) return;
    closing.current = true;

    const img = imgRef.current;
    if (!img) {
      onClosed();
      return;
    }

    // Measure the image's untransformed rect even if the open animation is
    // still running, then restore its current transform.
    gsap.killTweensOf(img);
    const cx = gsap.getProperty(img, "x") as number;
    const cy = gsap.getProperty(img, "y") as number;
    const cs = gsap.getProperty(img, "scale") as number;
    gsap.set(img, { x: 0, y: 0, scale: 1 });
    const dst = img.getBoundingClientRect();
    gsap.set(img, { x: cx, y: cy, scale: cs });

    const to = getReturnRect(product.id);
    const tl = gsap.timeline({ onComplete: onClosed });

    tl.to([textRef.current, closeRef.current], { opacity: 0, duration: 0.2 }, 0);
    if (to) {
      tl.to(
        img,
        {
          x: to.left - dst.left,
          y: to.top - dst.top,
          scale: to.width / dst.width,
          duration: 0.7,
          ease: "power3.inOut",
        },
        0,
      );
    } else {
      tl.to(img, { opacity: 0, duration: 0.3 }, 0);
    }
    tl.to(bgRef.current, { opacity: 0, duration: 0.6, ease: "power2.in" }, 0.15);
  }, [getReturnRect, onClosed, product.id]);

  // Escape to close + lock page scroll while open.
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      className={cn(
        poppins.className,
        "fixed inset-0 z-[100] overflow-y-auto text-white",
      )}
    >
      {/* Background image, dimmed */}
      <div
        ref={bgRef}
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/productbg.png)" }}
      >
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Close */}
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label="Back to products"
        className="fixed right-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-[#d9a346]/60 bg-black/50 text-[#f4d587] backdrop-blur transition-colors hover:bg-[#d9a346] hover:text-black md:right-8 md:top-8"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* Content */}
      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col items-center justify-center gap-8 px-6 py-24 md:flex-row md:gap-16">
        <div
          ref={imgRef}
          className="aspect-square w-[min(78vw,26rem)] shrink-0 will-change-transform"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain drop-shadow-2xl"
          />
        </div>

        <div ref={textRef} className="max-w-md text-center md:text-left">
          <MetallicGoldText
            as="h2"
            fold={false}
            className="text-2xl font-bold uppercase leading-tight md:text-4xl"
          >
            {product.name}
          </MetallicGoldText>

          <Reveal delay={300}>
            <p className="mt-5 text-base leading-snug md:text-lg">
              {product.description}
            </p>
          </Reveal>

          <Reveal delay={450}>
            <p className="mt-6 text-xl font-bold md:text-2xl">
              PHP {product.price.toFixed(2)}
            </p>
          </Reveal>

          <Reveal
            delay={600}
            className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start"
          >
            <button
              type="button"
              className="rounded-lg bg-[#5a3a14] px-7 py-2.5 text-sm font-bold uppercase text-white transition-colors hover:bg-[#6d4718]"
            >
              Add to Cart
            </button>
            <button
              type="button"
              className="rounded-lg px-7 py-2.5 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.03]"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              Buy Now
            </button>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;