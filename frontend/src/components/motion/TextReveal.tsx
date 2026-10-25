"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

export type TextRevealProps = {
  children: React.ReactNode;
  /**
   * "mask": inline-block clip, content slides up out of a hidden line.
   * "fade": content fades and rises into place.
   * @default "mask"
   */
  variant?: "mask" | "fade";
  /** Element whose position drives the reveal. Defaults to this element. */
  trigger?: React.RefObject<HTMLElement | null>;
  /** ScrollTrigger start, e.g. "top 50%". May be a function. @default "top 85%" */
  start?: string | (() => string);
  /** Seconds. @default 0 */
  delay?: number;
  /** Seconds. @default 0.9 */
  duration?: number;
  className?: string;
};

export function TextReveal({
  children,
  variant = "mask",
  trigger,
  start = "top 85%",
  delay = 0,
  duration = 0.9,
  className,
}: TextRevealProps) {
  const outerRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      outer.style.visibility = "visible";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(outer, { visibility: "visible" });
      const from =
        variant === "mask" ? { yPercent: 110 } : { opacity: 0, y: 28 };
      const to =
        variant === "mask" ? { yPercent: 0 } : { opacity: 1, y: 0 };

      gsap.fromTo(inner, from, {
        ...to,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: trigger?.current ?? outer,
          start,
          toggleActions: "play none none reverse",
        },
      });
    }, outer);

    return () => ctx.revert();
  }, [variant, trigger, start, delay, duration]);

  const isMask = variant === "mask";

  return (
    <div
      ref={outerRef}
      className={cn(
        isMask ? "inline-block max-w-full align-top overflow-hidden" : "block",
        className,
      )}
      // Padding + negative margin keeps glyph shadows from being clipped
      // without shifting layout.
      style={{
        visibility: "hidden",
        ...(isMask ? { padding: "10px", margin: "-10px" } : null),
      }}
    >
      <div ref={innerRef} className="will-change-transform">
        {children}
      </div>
    </div>
  );
}

export default TextReveal;