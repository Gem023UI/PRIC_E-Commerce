"use client";

import * as React from "react";

/* Metallic gold lettering lit by the cursor.
 *
 * The fill is four stacked gradients clipped to the glyphs:
 *   1. a tight specular hot spot under the cursor
 *   2. a wider bloom around it
 *   3. a falloff that darkens the metal away from the light
 *   4. the gold itself: banded stops whose angle and offset swing with the
 *      light's position, so the reflections slide across the letters
 *
 * The light position is written straight to CSS variables from a rAF loop,
 * so React never re-renders while the pointer moves. With no pointer (touch,
 * cursor outside the window) the light drifts slowly on its own. With
 * prefers-reduced-motion it stays fixed.
 */

const GOLD_FILL = [
  "radial-gradient(circle var(--r2, 5cqw) at var(--lx, 30%) var(--ly, 15%), rgba(255,255,255,0.95) 0%, rgba(255,247,214,0.55) 45%, rgba(255,247,214,0) 100%)",
  "radial-gradient(circle var(--r, 22cqw) at var(--lx, 30%) var(--ly, 15%), rgba(255,244,196,0.85) 0%, rgba(255,226,140,0.5) 28%, rgba(255,214,120,0.16) 58%, rgba(255,214,120,0) 80%)",
  "radial-gradient(circle var(--rf, 60cqw) at var(--lx, 30%) var(--ly, 15%), rgba(60,32,4,0) 0%, rgba(60,32,4,0.4) 100%)",
  "linear-gradient(var(--ang, 180deg), #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)",
].join(",");

const GOLD_STYLE: React.CSSProperties = {
  display: "inline-block",
  backgroundImage: GOLD_FILL,
  backgroundSize: "100% 100%, 100% 100%, 100% 100%, 280% 280%",
  backgroundPosition: "0 0, 0 0, 0 0, var(--bx, 50%) var(--by, 50%)",
  backgroundRepeat: "no-repeat",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
  WebkitTextStroke: "1px rgba(120, 76, 14, 0.35)",
  filter:
    "drop-shadow(0 0.01em 0 rgba(255, 238, 180, 0.5)) drop-shadow(0 0.08em 0.1em rgba(110, 70, 15, 0.3))",
};

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

export type MetallicGoldTextProps = React.HTMLAttributes<HTMLElement> & {
  /** Element to render. @default "span" */
  as?: React.ElementType;
  children: React.ReactNode;
};

export function MetallicGoldText({
  as: Tag = "span",
  children,
  style,
  ...props
}: MetallicGoldTextProps) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const pointer = { x: 0, y: 0, active: false };
    const light = { x: 0, y: 0, ready: false };
    let raf = 0;

    const paint = (w: number, h: number) => {
      const dx = light.x - w / 2;
      const dy = light.y - h / 2;
      // Direction the light travels across the letters. The bias keeps the
      // angle stable when the cursor sits near the centre.
      const ang = (Math.atan2(-dx, -dy + h * 0.5) * 180) / Math.PI;

      el.style.setProperty("--lx", `${light.x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${light.y.toFixed(1)}px`);
      el.style.setProperty("--ang", `${ang.toFixed(1)}deg`);
      el.style.setProperty("--r", `${(w * 0.42).toFixed(1)}px`);
      el.style.setProperty("--r2", `${(w * 0.07).toFixed(1)}px`);
      el.style.setProperty("--rf", `${(w * 1.1).toFixed(1)}px`);
      el.style.setProperty("--bx", `${50 + clamp(dx / w, -1, 1) * 40}%`);
      el.style.setProperty("--by", `${50 + clamp(dy / h, -1, 1) * 40}%`);
    };

    if (reduceMotion) {
      const { width, height } = el.getBoundingClientRect();
      light.x = width * 0.3;
      light.y = height * 0.18;
      paint(width || 1, height || 1);
      return;
    }

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    };
    const onRelease = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") pointer.active = false;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onRelease, { passive: true });
    window.addEventListener("pointercancel", onRelease, { passive: true });
    window.addEventListener("blur", onLeave);
    document.documentElement.addEventListener("pointerleave", onLeave);

    const tick = (t: number) => {
      const rect = el.getBoundingClientRect();
      const w = rect.width || 1;
      const h = rect.height || 1;

      const tx = pointer.active
        ? pointer.x - rect.left
        : w * (0.5 + 0.42 * Math.sin(t / 2600));
      const ty = pointer.active
        ? pointer.y - rect.top
        : h * (0.22 + 0.14 * Math.cos(t / 3100));

      if (!light.ready) {
        light.x = tx;
        light.y = ty;
        light.ready = true;
      } else {
        light.x += (tx - light.x) * 0.14;
        light.y += (ty - light.y) * 0.14;
      }

      paint(w, h);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onRelease);
      window.removeEventListener("pointercancel", onRelease);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <Tag ref={ref} style={{ ...GOLD_STYLE, ...style }} {...props}>
      {children}
    </Tag>
  );
}

export default MetallicGoldText;