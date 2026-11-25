import type { ReactNode } from "react";

import type { Metric } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { CARD, ChangePill } from "./ui";

/** A bento tile: small label, the figure, a one-line definition, and an optional footer. */
export function Tile({
  label,
  description,
  className,
  footer,
  children,
}: {
  label: string;
  description: string;
  className?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className={cn(CARD, "flex min-h-[11rem] flex-col p-5", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/60">{label}</h3>
      <div className="mt-3">{children}</div>
      <p className="mt-2 text-sm leading-snug text-white/65">{description}</p>
      {footer && (
        <div className="mt-auto pt-4">
          <div className="border-t border-white/10 pt-3">{footer}</div>
        </div>
      )}
    </article>
  );
}

const SIZES = {
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl md:text-5xl",
} as const;

export function Value({
  size = "md",
  className,
  children,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("font-bold tabular-nums tracking-tight text-white", SIZES[size], className)}>
      {children}
    </p>
  );
}

export const Note = ({ children }: { children: ReactNode }) => (
  <p className="text-xs text-white/55">{children}</p>
);

/** Change pill for a metric, or a plain note when there is nothing to show yet. */
export function MetricFooter({
  metric,
  compare,
  goodWhen = "up",
  emptyNote,
}: {
  metric: Metric;
  compare: string;
  goodWhen?: "up" | "down";
  emptyNote?: string;
}) {
  if (metric.value === 0 && metric.previous === 0 && emptyNote) {
    return <p className="text-xs text-white/50">{emptyNote}</p>;
  }
  return <ChangePill change={metric.change} label={compare} goodWhen={goodWhen} />;
}

export function TileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(CARD, "min-h-[11rem] animate-pulse p-5", className)} aria-hidden>
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="mt-4 h-8 w-40 rounded bg-white/10" />
      <div className="mt-4 h-3 w-full rounded bg-white/5" />
      <div className="mt-2 h-3 w-2/3 rounded bg-white/5" />
    </div>
  );
}