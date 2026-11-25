import type { ReactNode } from "react";

import { formatPercent } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

export const CARD = "rounded-2xl border border-white/10 bg-black";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-white/60">{subtitle}</p>}
        </div>
      </div>
      {children}
    </header>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full border border-red-300/40 px-4 py-1.5 font-medium transition-colors hover:bg-red-400/15"
      >
        Try again
      </button>
    </div>
  );
}

const Arrow = ({ up }: { up: boolean }) => (
  <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden="true" fill="currentColor">
    {up ? <path d="M5 1.5 9 8H1z" /> : <path d="M5 8.5 1 2h8z" />}
  </svg>
);

/** Percent change pill: green when the change is good, red when it is bad. */
export function ChangePill({
  change,
  label,
  goodWhen = "up",
}: {
  change: number | null;
  label: string;
  goodWhen?: "up" | "down";
}) {
  if (change === null) {
    return <p className="text-xs text-white/45">Nothing earlier to compare with</p>;
  }
  if (change === 0) {
    return <p className="text-xs text-white/55">No change {label}</p>;
  }
  const up = change > 0;
  const good = (goodWhen === "up") === up;
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
          good ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300",
        )}
      >
        <Arrow up={up} />
        {formatPercent(change)}
      </span>
      <span className="text-white/45">{label}</span>
    </p>
  );
}