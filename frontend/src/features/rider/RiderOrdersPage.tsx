"use client";

import * as React from "react";
import Link from "next/link";

import { OrderStatusBadge } from "@/features/admin/Badges";
import { RefreshIcon } from "@/features/admin/icons";
import { adminApi } from "@/lib/admin-api";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { PAYMENT_LABELS } from "@/lib/orders";
import type { RiderOrderRow } from "@/lib/rider";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function OrderCard({ o, done }: { o: RiderOrderRow; done?: boolean }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-black p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold tracking-wide text-[#f4d587]">{o.ref}</p>
          <p className="mt-1 truncate text-base font-semibold text-white">{o.fullName}</p>
          <p className="truncate text-sm text-white/60">{o.area}</p>
        </div>
        <OrderStatusBadge status={o.status === "completed" ? "completed" : o.status === "on_delivery" ? "on_delivery" : "to_ship"} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/70">
        <span>
          {formatInt(o.itemCount)} {o.itemCount === 1 ? "item" : "items"}
        </span>
        <span className="font-semibold tabular-nums text-white">{formatPeso(o.total)}</span>
        {o.collectAmount > 0 ? (
          <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-300">
            Collect {formatPeso(o.collectAmount)}
          </span>
        ) : (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
            {PAYMENT_LABELS[o.paymentMethod]} · nothing to collect
          </span>
        )}
      </div>

      {done ? (
        <p className="mt-3 text-xs text-white/50">
          Delivered {o.completedAt ? dateFmt.format(new Date(o.completedAt)) : ""}
        </p>
      ) : (
        <Link
          href={`/rider/orders/${o.id}`}
          className="mt-4 block rounded-xl py-3 text-center text-sm font-bold text-black transition-transform active:scale-[0.99]"
          style={{ backgroundImage: GOLD_GRADIENT }}
        >
          View order
        </Link>
      )}
    </li>
  );
}

export function RiderOrdersPage() {
  const [active, setActive] = React.useState<RiderOrderRow[] | null>(null);
  const [recent, setRecent] = React.useState<RiderOrderRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const r = await adminApi<{ active: RiderOrderRow[]; recent: RiderOrderRow[] }>("/api/rider/orders", {
          signal: ctrl.signal,
        });
        if (r.ok && r.data.active) {
          setActive(r.data.active);
          setRecent(r.data.recent ?? []);
          setError(null);
        } else {
          setError("We couldn't load your deliveries.");
        }
      } catch {
        return;
      }
      setLoading(false);
    })();
    return () => ctrl.abort();
  }, [tick]);

  // Quietly pick up new assignments while the app is open.
  React.useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">My deliveries</h1>
          <p className="mt-1 text-sm text-white/60">Orders assigned to you.</p>
        </div>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          disabled={loading}
          aria-label="Refresh"
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 disabled:opacity-60"
        >
          <RefreshIcon className={cn("size-4", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {!active ? (
        <div className="mt-6 space-y-3" aria-hidden>
          {[0, 1].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-white">No deliveries right now</p>
          <p className="mt-1 text-sm text-white/55">New assignments appear here automatically.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {active.map((o) => (
            <OrderCard key={o.id} o={o} />
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">Recently delivered</h2>
          <ul className="mt-3 space-y-3">
            {recent.map((o) => (
              <OrderCard key={o.id} o={o} done />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default RiderOrdersPage;