import type { CSSProperties } from "react";

const GLOW_SIZE = "clamp(420px, 60vmax, 1000px)";

// Gold at the center, fading to fully transparent at the circle's edge.
const GLOW_FILL =
  "radial-gradient(circle closest-side, rgba(219, 170, 56, 0.5) 0%, rgba(219, 155, 26, 0.32) 28%, rgba(214,150,30,0.14) 58%, rgba(214,150,30,0) 100%)";

const base: CSSProperties = {
  position: "absolute",
  width: GLOW_SIZE,
  height: GLOW_SIZE,
  borderRadius: "9999px",
  backgroundImage: GLOW_FILL,
  filter: "saturate(1.15)",
  willChange: "opacity",
};

const KEYFRAMES = `
@keyframes bg-glow-shine{0%,100%{opacity:.82}50%{opacity:1}}
.bg-glow-shine{animation:bg-glow-shine 7s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.bg-glow-shine{animation:none}}
`;

/** Fixed black backdrop with gold glows at the top-right and lower-left.
 *  Sits behind all page content. */
export default function BackgroundGlow() {
  return (
    <>
      <style href="bg-glow-shine" precedence="default">
        {KEYFRAMES}
      </style>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black"
      >
        <div
          className="bg-glow-shine"
          style={{
            ...base,
            top: -5,
            right: -5,
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="bg-glow-shine"
          style={{
            ...base,
            bottom: 0,
            left: 0,
            transform: "translate(-30%, 30%)",
            animationDelay: "-3.5s",
          }}
        />
      </div>
    </>
  );
}