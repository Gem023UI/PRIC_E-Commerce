"use client";

import * as React from "react";

export type RevealProps = React.HTMLAttributes<HTMLElement> & {
  /** Element to render. @default "div" */
  as?: React.ElementType;
  /** Delay in ms, used for staggering. @default 0 */
  delay?: number;
  /** Start offset in px (slides up into place). @default 24 */
  y?: number;
  /** Transition length in ms. @default 800 */
  duration?: number;
  /** Fraction of the element that must be visible to trigger. @default 0.2 */
  threshold?: number;
};

export function Reveal({
  as: Tag = "div",
  delay = 0,
  y = 24,
  duration = 800,
  threshold = 0.2,
  style,
  children,
  ...props
}: RevealProps) {
  const ref = React.useRef<HTMLElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : `translate3d(0, ${y}px, 0)`,
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Reveal;