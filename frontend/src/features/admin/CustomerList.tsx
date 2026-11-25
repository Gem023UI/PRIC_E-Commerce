"use client";

import * as React from "react";

import { formatDate, type CustomerListResponse } from "@/lib/admin-customers";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { AccountStateBadge, TypeBadge } from "./badges";
import { CARD } from "./ui";

type Params = {
  search: string;
  type: string;
  buying: string;
  sort: string;
  page: number;
};

const TYPES: [string, string][] = [
  ["all", "All customers"],
  ["account", "Accounts"],
  ["guest", "Guests"],
];
const BUYING: [string, string][] = [
  ["all", "Any activity"],
  ["ordered", "Has ordered"],
  ["repeat", "Repeat buyers"],
  ["never", "Never ordered"],
];
const SORTS: [string, string][] = [
  ["recent", "Latest order"],
  ["spent", "Highest spend"],
  ["orders", "Most orders"],
  ["newest", "Newest first"],
  ["name", "Name A–Z"],
];

const SELECT =
  "min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50 [&>option]:bg-neutral-900";

const COLS = "md:grid-cols-[minmax(0,2.4fr)_8.5rem_4.5rem_8rem_7.5rem]";

export function CustomerList({
  reloadKey,
  onOpen,
}: {
  reloadKey: number;
  onOpen: (email: string) => void;
}) {
  const [params, setParams] = React.useState<Params>({
    search: "",
    type: "all",
    buying: "all",
    sort: "recent",
    page: 1,
  });
  const [searchInput, setSearchInput] = React.useState("");
  const [data, setData] = React.useState<CustomerListResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Debounce typing in the search box.
  React.useEffect(() => {
    const id = setTimeout(() => {
      setParams((p) => (p.search === searchInput.trim() ? p : { ...p, search: searchInput.trim(), page: 1 }));
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const qs = new URLSearchParams({
      search: params.search,
      type: params.type,
      buying: params.buying,
      sort: params.sort,
      page: String(params.page),
    });

    (async () => {
      try {
        const res = await fetch(`/api/admin/customers?${qs}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (res.status === 401 || res.status === 403) {
          window.location.assign("/login");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as CustomerListResponse);
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("We couldn't load the customer list.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [params, reloadKey]);

  const set = (patch: Partial<Params>) => setParams((p) => ({ ...p, ...patch, page: patch.page ?? 1 }));
  const stale = loading && !!data;

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Customer list">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">All customers</h2>
          <p className="mt-1 text-sm text-white/60">
            {data
              ? `${formatInt(data.counts.all)} total · ${formatInt(data.counts.accounts)} with accounts · ${formatInt(data.counts.guests)} guests`
              : "Loading…"}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <label className="min-w-[14rem] flex-1">
          <span className="sr-only">Search customers</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone"
            className="min-h-10 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50"
          />
        </label>
        <select aria-label="Customer type" value={params.type} onChange={(e) => set({ type: e.target.value })} className={SELECT}>
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Buying activity" value={params.buying} onChange={(e) => set({ buying: e.target.value })} className={SELECT}>
          {BUYING.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select aria-label="Sort by" value={params.sort} onChange={(e) => set({ sort: e.target.value })} className={SELECT}>
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

      <div
        aria-busy={stale}
        className={cn("mt-5 transition-opacity duration-200", stale && "opacity-60")}
      >
        {/* Column headers (desktop) */}
        <div
          className={cn(
            "hidden gap-x-4 border-b border-white/10 px-4 pb-2 text-xs uppercase tracking-widest text-white/45 md:grid",
            COLS,
          )}
        >
          <span>Customer</span>
          <span>Type</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Spent</span>
          <span className="text-right">Last order</span>
        </div>

        {!data ? (
          <div className="space-y-2 pt-3" aria-hidden>
            {[0, 1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : data.customers.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-white/55">
            {data.counts.all === 0
              ? "No customers yet. They appear here once someone orders or you add an account."
              : "No customers match these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data.customers.map((c) => (
              <li key={c.email}>
                <button
                  type="button"
                  onClick={() => onOpen(c.email)}
                  className={cn(
                    "grid w-full gap-x-4 gap-y-2 rounded-lg px-4 py-3.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#efc673] md:items-center",
                    COLS,
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {c.name || c.email}
                    </span>
                    <span className="block truncate text-xs text-white/55">{c.email}</span>
                  </span>

                  <span className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={c.type} />
                    {c.accountState && c.accountState !== "active" && (
                      <AccountStateBadge state={c.accountState} />
                    )}
                  </span>

                  <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/70 md:contents md:text-sm">
                    <span className="md:text-right md:tabular-nums">
                      <span className="text-white/40 md:hidden">Orders </span>
                      {formatInt(c.orders)}
                    </span>
                    <span className="md:text-right md:font-semibold md:tabular-nums md:text-white">
                      <span className="text-white/40 md:hidden">Spent </span>
                      {formatPeso(c.spent)}
                    </span>
                    <span className="md:text-right md:text-white/70">
                      <span className="text-white/40 md:hidden">Last order </span>
                      {formatDate(c.lastOrderAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.pages > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
          <span className="text-white/55">
            Page {data.page} of {data.pages} · {formatInt(data.total)} customers
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