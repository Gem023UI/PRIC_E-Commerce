"use client";

import * as React from "react";

import {
  DEFAULT_FILTERS,
  formatDateTime,
  type OrderFilters,
  type OrderListResponse,
  type RiderRow,
} from "@/lib/admin-orders";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { PAYMENT_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/orders";
import { cn } from "@/lib/utils";

import { OrderStatusBadge, PaymentBadge } from "./Badges";
import { CARD } from "./ui";

const SELECT =
  "min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50 [&>option]:bg-neutral-900";

const COLS = "md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,1fr)_7rem_7.5rem]";

const SORTS: [string, string][] = [
  ["newest", "Newest first"],
  ["oldest", "Oldest first"],
  ["total", "Highest total"],
];

export function OrderList({
  filters,
  onFilters,
  riders,
  reloadKey,
  onOpen,
}: {
  filters: OrderFilters;
  onFilters: (next: OrderFilters) => void;
  riders: RiderRow[];
  reloadKey: number;
  onOpen: (id: string) => void;
}) {
  const [searchInput, setSearchInput] = React.useState(filters.search);
  const [data, setData] = React.useState<OrderListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Keep the box in step when a preset (e.g. from "Needs attention") replaces the filters.
  React.useEffect(() => setSearchInput(filters.search), [filters.search]);

  // Debounce typing.
  React.useEffect(() => {
    const next = searchInput.trim();
    if (next === filters.search) return;
    const id = setTimeout(() => onFilters({ ...filters, search: next, page: 1 }), 300);
    return () => clearTimeout(id);
  }, [searchInput, filters, onFilters]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams({
      search: filters.search,
      status: filters.status,
      payment: filters.payment,
      rider: filters.rider,
      sort: filters.sort,
      page: String(filters.page),
    });

    (async () => {
      try {
        const res = await fetch(`/api/admin/orders?${qs}`, { cache: "no-store", signal: ctrl.signal });
        if (res.status === 401 || res.status === 403) {
          window.location.assign("/login");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as OrderListResponse);
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("We couldn't load the orders.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [filters, reloadKey]);

  const set = (patch: Partial<OrderFilters>) => onFilters({ ...filters, ...patch, page: patch.page ?? 1 });
  const stale = loading && !!data;
  const dirty = JSON.stringify({ ...filters, page: 1 }) !== JSON.stringify(DEFAULT_FILTERS);

  const chips: [string, string, number | undefined][] = [
    ["all", "All", data?.counts.all],
    ["active", "Active", data?.counts.active],
    ["to_confirm", "To confirm", data?.counts.to_confirm],
    ["to_ship", "To ship", data?.counts.to_ship],
    ["on_delivery", "On delivery", data?.counts.on_delivery],
    ["completed", "Completed", data?.counts.completed],
    ["cancelled", "Cancelled", data?.counts.cancelled],
  ];

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Orders">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">All orders</h2>
          <p className="mt-1 text-sm text-white/60">
            {data ? `${formatInt(data.total)} ${data.total === 1 ? "order" : "orders"} match` : "Loading…"}
          </p>
        </div>
        {dirty && (
          <button
            type="button"
            onClick={() => onFilters(DEFAULT_FILTERS)}
            className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Order status"
        className="-mx-1 mt-5 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filters.status === value}
            onClick={() => set({ status: value })}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]",
              filters.status === value
                ? "border-[#efc673]/60 bg-[#efc673]/15 font-semibold text-[#f4d587]"
                : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white",
            )}
          >
            {label}
            {count !== undefined && <span className="ml-1.5 tabular-nums text-white/50">{formatInt(count)}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="min-w-[14rem] flex-1">
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search code, name, email or phone"
            className="min-h-10 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50"
          />
        </label>
        <select aria-label="Payment status" value={filters.payment} onChange={(e) => set({ payment: e.target.value })} className={SELECT}>
          <option value="all">Any payment</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Rider" value={filters.rider} onChange={(e) => set({ rider: e.target.value })} className={SELECT}>
          <option value="all">Any rider</option>
          <option value="unassigned">Unassigned</option>
          {riders.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <select aria-label="Sort by" value={filters.sort} onChange={(e) => set({ sort: e.target.value })} className={SELECT}>
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div aria-busy={stale} className={cn("mt-5 transition-opacity duration-200", stale && "opacity-60")}>
        <div
          className={cn(
            "hidden gap-x-4 border-b border-white/10 px-4 pb-2 text-xs uppercase tracking-widest text-white/45 md:grid",
            COLS,
          )}
        >
          <span>Order</span>
          <span>Status</span>
          <span>Rider</span>
          <span className="text-right">Total</span>
          <span className="text-right">Placed</span>
        </div>

        {!data ? (
          <div className="space-y-2 pt-3" aria-hidden>
            {[0, 1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : data.orders.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-white/55">
            {data.counts.all === 0
              ? "No orders yet. They appear here as customers check out."
              : "No orders match these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data.orders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => onOpen(o.id)}
                  className={cn(
                    "grid w-full gap-x-4 gap-y-2 rounded-lg px-4 py-3.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#efc673] md:items-center",
                    COLS,
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-xs font-semibold tracking-wide text-[#f4d587]">
                      {o.trackingCode}
                    </span>
                    <span className="mt-1 block truncate text-sm text-white">{o.fullName}</span>
                    <span className="block truncate text-xs text-white/50">
                      {formatInt(o.itemCount)} {o.itemCount === 1 ? "item" : "items"} · {o.city}
                    </span>
                  </span>

                  <span className="flex flex-wrap items-center gap-1.5">
                    <OrderStatusBadge status={o.status} />
                    <PaymentBadge status={o.paymentStatus} />
                    <span className="w-full text-xs text-white/45">{PAYMENT_LABELS[o.paymentMethod]}</span>
                  </span>

                  <span className="text-sm">
                    {o.rider ? (
                      <span className="text-white/85">{o.rider.name}</span>
                    ) : o.status === "to_ship" ? (
                      <span className="font-semibold text-orange-300">Needs a rider</span>
                    ) : (
                      <span className="text-white/35">—</span>
                    )}
                  </span>

                  <span className="text-sm font-semibold tabular-nums text-white md:text-right">
                    {formatPeso(o.total)}
                  </span>
                  <span className="text-xs text-white/60 md:text-right">{formatDateTime(o.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.pages > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
          <span className="text-white/55">
            Page {data.page} of {data.pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={data.page <= 1 || loading}
              onClick={() => set({ page: data.page - 1 })}
              className="rounded-full border border-white/15 px-4 py-1.5 text-white/85 transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={data.page >= data.pages || loading}
              onClick={() => set({ page: data.page + 1 })}
              className="rounded-full border border-white/15 px-4 py-1.5 text-white/85 transition-colors hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}