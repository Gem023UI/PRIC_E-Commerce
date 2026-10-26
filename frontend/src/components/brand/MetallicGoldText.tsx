"use client";

import * as React from "react";

import FoldText, { type FoldTextProps } from "@/components/motion/FoldText/FoldText";
import { cn } from "@/lib/utils";

/* Metallic gold lettering lit by the cursor, revealed with a fold animation.
 *
 * Fold mode (default): the text is rendered through FoldText, split by
 * character. The fold plays once, only when the element scrolls into view
 * (FoldText's ScrollTrigger). The gold is painted per character, but every
 * character samples the SAME gradient space (the whole element), so the
 * metal reads as one continuous surface:
 *   - per-character offsets (--ox/--oy) are measured once and on resize
 *   - the light (--lx/--ly) and the gold layer offset (--x0/--y0) are written
 *     from a rAF loop, so React never re-renders while the pointer moves
 * The loop pauses while the element is off screen.
 *
 * Static mode (fold={false}, or children that are not plain text): the
 * original single-element metallic fill with no fold animation.
 *
 * The fill is four stacked gradients clipped to the glyphs:
 *   1. a tight specular hot spot under the cursor
 *   2. a wider bloom around it
 *   3. a falloff that darkens the metal away from the light
 *   4. the gold itself, whose angle and offset swing with the light
 * With no pointer (touch, cursor outside the window) the light drifts on its
 * own. With prefers-reduced-motion it stays fixed.
 */

const GOLD_FILL = [
  "radial-gradient(circle var(--r2, 5cqw) at var(--lx, 30%) var(--ly, 15%), rgba(255,255,255,0.95) 0%, rgba(255,247,214,0.55) 45%, rgba(255,247,214,0) 100%)",
  "radial-gradient(circle var(--r, 22cqw) at var(--lx, 30%) var(--ly, 15%), rgba(255,244,196,0.85) 0%, rgba(255,226,140,0.5) 28%, rgba(255,214,120,0.16) 58%, rgba(255,214,120,0) 80%)",
  "radial-gradient(circle var(--rf, 60cqw) at var(--lx, 30%) var(--ly, 15%), rgba(60,32,4,0) 0%, rgba(60,32,4,0.4) 100%)",
  "linear-gradient(var(--ang, 180deg), #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)",
].join(",");

const SHADOW =
  "drop-shadow(0 0.01em 0 rgba(255, 238, 180, 0.5)) drop-shadow(0 0.08em 0.1em rgba(110, 70, 15, 0.3))";

const STROKE = "1px rgba(120, 76, 14, 0.35)";

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
  WebkitTextStroke: STROKE,
  filter: SHADOW,
};

// Fold mode: each FoldText piece paints the shared gradient space.
const W = "var(--mg-w, 100%)";
const H = "var(--mg-h, 100%)";
const OX = "calc(var(--ox, 0px) * -1)";
const OY = "calc(var(--oy, 0px) * -1)";
const FOLD_CSS = `
.mg-fold{display:inline-block;filter:${SHADOW}}
.mg-fold .fold-text{vertical-align:top}
.mg-fold .fold-text-piece{
  background-image:${GOLD_FILL};
  background-size:${W} ${H},${W} ${H},${W} ${H},calc(${W} * 2.8) calc(${H} * 2.8);
  background-position:${OX} ${OY},${OX} ${OY},${OX} ${OY},calc(var(--x0, 0px) - var(--ox, 0px)) calc(var(--y0, 0px) - var(--oy, 0px));
  background-repeat:no-repeat;
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;color:transparent;
  -webkit-text-stroke:${STROKE};
}
`;

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

/** Plain text of the children, or null if they contain elements. */
function toText(node: React.ReactNode): string | null {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    let out = "";
    for (const n of node) {
      const t = toText(n);
      if (t === null) return null;
      out += t;
    }
    return out;
  }
  return null;
}

export type FoldOptions = Partial<
  Omit<
    FoldTextProps,
    "text" | "trigger" | "className" | "style" | "color" | "fontSize" | "fontWeight"
  >
>;

export type MetallicGoldTextProps = React.HTMLAttributes<HTMLElement> & {
  /** Element to render. @default "span" */
  as?: React.ElementType;
  children: React.ReactNode;
  /**
   * Fold-in animation, played once when the element enters the viewport.
   * true (default) = built-in defaults, false = static metallic text,
   * object = override FoldText options (stagger, duration, hinge, ...).
   * @default true
   */
  fold?: boolean | FoldOptions;
};

export function MetallicGoldText({
  as: Tag = "span",
  children,
  style,
  className,
  fold = true,
  ...props
}: MetallicGoldTextProps) {
  const ref = React.useRef<HTMLElement>(null);

  const foldText = fold === false ? null : toText(children);
  const isFold = foldText !== null;

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const pointer = { x: 0, y: 0, active: false };
    const light = { x: 0, y: 0, ready: false };
    let raf = 0;

    // Fold mode: size of the shared gradient space + each piece's offset in it.
    const measure = () => {
      const box = el.getBoundingClientRect();
      el.style.setProperty("--mg-w", `${box.width}px`);
      el.style.setProperty("--mg-h", `${box.height}px`);
      el.querySelectorAll<HTMLElement>(".fold-text-piece").forEach((piece) => {
        const seg = (piece.parentElement ?? piece).getBoundingClientRect();
        piece.style.setProperty("--ox", `${(seg.left - box.left).toFixed(1)}px`);
        piece.style.setProperty("--oy", `${(seg.top - box.top).toFixed(1)}px`);
      });
    };

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

      const fx = clamp(dx / w, -1, 1) * 0.4 + 0.5;
      const fy = clamp(dy / h, -1, 1) * 0.4 + 0.5;
      if (isFold) {
        // 280% layer: percentage position -> pixels in the shared space
        el.style.setProperty("--x0", `${((w - w * 2.8) * fx).toFixed(1)}px`);
        el.style.setProperty("--y0", `${((h - h * 2.8) * fy).toFixed(1)}px`);
      } else {
        el.style.setProperty("--bx", `${(fx * 100).toFixed(1)}%`);
        el.style.setProperty("--by", `${(fy * 100).toFixed(1)}%`);
      }
    };

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
        : reduceMotion
          ? w * 0.3
          : w * (0.5 + 0.42 * Math.sin(t / 2600));
      const ty = pointer.active
        ? pointer.y - rect.top
        : reduceMotion
          ? h * 0.18
          : h * (0.22 + 0.14 * Math.cos(t / 3100));

      if (!light.ready) {
        light.x = tx;
        light.y = ty;
        light.ready = true;
      } else {
        const ease = reduceMotion ? 1 : 0.14;
        light.x += (tx - light.x) * ease;
        light.y += (ty - light.y) * ease;
      }

      paint(w, h);
      raf = requestAnimationFrame(tick);
    };

    // Only run the light loop while the element is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!raf) raf = requestAnimationFrame(tick);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(el);
    raf = requestAnimationFrame(tick);

    let ro: ResizeObserver | undefined;
    if (isFold) {
      measure();
      ro = new ResizeObserver(measure);
      ro.observe(el);
      document.fonts?.ready.then(measure).catch(() => undefined);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro?.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onRelease);
      window.removeEventListener("pointercancel", onRelease);
      window.removeEventListener("blur", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [isFold, foldText]);

  if (!isFold) {
    return (
      <Tag
        ref={ref}
        className={className}
        style={{ ...GOLD_STYLE, ...style }}
        {...props}
      >
        {children}
      </Tag>
    );
  }

  // Typography goes to FoldText (it sets font-size/weight through its own
  // variables); layout styles stay on the wrapper.
  const { fontSize, fontWeight, lineHeight, letterSpacing, ...restStyle } =
    style ?? {};
  const opts = typeof fold === "object" ? fold : {};

  return (
    <>
      <style href="metallic-gold-fold" precedence="default">
        {FOLD_CSS}
      </style>
      <Tag
        ref={ref}
        className={cn("mg-fold", className)}
        style={restStyle}
        {...props}
      >
        <FoldText
          splitBy="char"
          foldStyle="paper"
          hinge="bottom"
          stagger={0.03}
          {...opts}
          text={foldText}
          trigger="scroll"
          color="currentColor"
          fontSize={fontSize ?? "inherit"}
          fontWeight={(fontWeight ?? "inherit") as string | number}
          style={{
            lineHeight: lineHeight ?? "inherit",
            letterSpacing: letterSpacing ?? "normal",
          }}
        />
      </Tag>
    </>
  );
}

export default MetallicGoldText;