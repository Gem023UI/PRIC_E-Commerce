import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { CARD } from "./ui";

type Props = {
  icon: ReactNode;
  iconClassName?: string;
  value: string;
  title: string;
  description: string;
  badge?: string;
  footer?: ReactNode;
};

export function KpiCard({ icon, iconClassName, value, title, description, badge, footer }: Props) {
  return (
    <article className={cn(CARD, "flex min-h-[11.5rem] flex-col p-5")}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("[&>svg]:size-[18px]", iconClassName ?? "text-white/90")}>{icon}</span>
        {badge && (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-[1.75rem] font-bold leading-none tracking-tight text-white/95 tabular-nums">
        {value}
      </p>
      <h3 className="mt-3 text-[0.95rem] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-snug text-white/70">{description}</p>
      {footer && (
        <div className="mt-auto pt-4">
          <div className="border-t border-white/10 pt-3">{footer}</div>
        </div>
      )}
    </article>
  );
}

export function KpiSkeleton() {
  return (
    <div className={cn(CARD, "min-h-[11.5rem] animate-pulse p-5")} aria-hidden>
      <div className="size-[18px] rounded bg-white/10" />
      <div className="mt-4 h-7 w-32 rounded bg-white/10" />
      <div className="mt-4 h-4 w-40 rounded bg-white/10" />
      <div className="mt-3 h-3 w-full rounded bg-white/5" />
      <div className="mt-2 h-3 w-2/3 rounded bg-white/5" />
    </div>
  );
}

export function FootNote({ children }: { children: ReactNode }) {
  return <p className="text-xs text-white/55">{children}</p>;
}