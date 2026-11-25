"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationList,
  type ApplicationStatus,
} from "@/lib/admin-engagement";
import { formatDateTime } from "@/lib/admin-orders";
import { formatInt } from "@/lib/admin-stats";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { ApplicationDrawer } from "./ApplicationDrawer";
import { ApplicationStatusBadge } from "./badges";
import { CARD } from "./ui";

const SELECT =
  "min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50 [&>option]:bg-neutral-900";

const COLS = "md:grid-cols-[minmax(0,2fr)_6rem_9rem_8rem_8.5rem]";

type Filters = { status: string; category: string; search: string; page: number };

export function ApplicationsPanel({
  seminar,
  onClearSeminar,
  initialStatus = "all",
  onChanged,
}: {
  seminar: string;
  onClearSeminar: () => void;
  initialStatus?: "all" | ApplicationStatus;
  onChanged: () => void;
}) {
  const [filters, setFilters] = React.useState<Filters>({ status: initialStatus, category: "all", search: "", page: 1 });
  const [searchInput, setSearchInput] = React.useState("");
  const [data, setData] = React.useState<ApplicationList | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const closeDrawer = React.useCallback(() => setSelected(null), []);

  React.useEffect(() => {
    const next = searchInput.trim();
    if (next === filters.search) return;
    const id = setTimeout(() => setFilters((f) => ({ ...f, search: next, page: 1 })), 300);
    return () => clearTimeout(id);
  }, [searchInput, filters.search]);

  // Picking a seminar elsewhere on the page starts again from its first page.
  React.useEffect(() => setFilters((f) => ({ ...f, page: 1 })), [seminar]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams({ status: filters.status, category: filters.category, seminar, search: filters.search, page: String(filters.page) });
    (async () => {
      try {
        const r = await adminApi<ApplicationList>(`/api/admin/applications?${qs}`, { signal: ctrl.signal });
        if (r.ok) {
          setData(r.data as ApplicationList);
          setError(null);
        } else setError("We couldn't load the applications.");
      } catch {
        return;
      }
      setLoading(false);
    })();
    return () => ctrl.abort();
  }, [filters, seminar, tick]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  const stale = loading && !!data;
  const chips: [string, string, number | undefined][] = [
    ["all", "All", data?.counts.all],
    ...(["new", "under_review", "approved", "rejected"] as const).map(
      (s): [string, string, number | undefined] => [s, APPLICATION_STATUS_LABELS[s], data?.counts[s]],
    ),
  ];

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Membership applications">
      <h2 className="text-lg font-semibold text-white">Membership applications</h2>
      <p className="mt-1 text-sm text-white/60">Personal Information Sheets submitted through the website.</p>

      {seminar && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#efc673]/40 bg-[#efc673]/10 px-3.5 py-1.5 text-sm text-[#f4d587]">
          Seminar: {formatShortDate(seminar)}
          <button type="button" onClick={onClearSeminar} aria-label="Clear the seminar filter" className="text-lg leading-none opacity-70 hover:opacity-100">
            ×
          </button>
        </p>
      )}

      <div role="group" aria-label="Application status" className="-mx-1 mt-4 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          <span className="sr-only">Search applications</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or phone"
            className="min-h-10 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50"
          />
        </label>
        <select aria-label="Member type" value={filters.category} onChange={(e) => set({ category: e.target.value })} className={SELECT}>
          <option value="all">Any member type</option>
          <option value="ARB">ARB</option>
          <option value="ARB HH">ARB HH</option>
          <option value="NON-ARB">NON-ARB</option>
        </select>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div aria-busy={stale} className={cn("mt-5 transition-opacity", stale && "opacity-60")}>
        <div className={cn("hidden gap-x-4 border-b border-white/10 px-4 pb-2 text-xs uppercase tracking-widest text-white/45 md:grid", COLS)}>
          <span>Applicant</span>
          <span>Type</span>
          <span>Seminar</span>
          <span>Status</span>
          <span className="text-right">Submitted</span>
        </div>

        {!data ? (
          <div className="space-y-2 pt-3" aria-hidden>
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-14 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : data.applications.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-white/55">
            {data.counts.all === 0 ? "No applications yet." : "No applications match these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data.applications.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(a.id)}
                  className={cn("grid w-full gap-x-4 gap-y-1.5 rounded-lg px-4 py-3.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#efc673] md:items-center", COLS)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{a.name}</span>
                    <span className="block truncate text-xs text-white/50">
                      <span className="font-mono">{a.reference}</span> · {a.phone}
                    </span>
                  </span>
                  <span className="text-sm text-white/80">{a.category}</span>
                  <span className="text-sm text-white/80">{formatShortDate(a.scheduleDate)}</span>
                  <span>
                    <ApplicationStatusBadge status={a.status} />
                  </span>
                  <span className="text-xs text-white/60 md:text-right">{formatDateTime(a.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {data && data.pages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-sm">
          <span className="text-white/55">Page {data.page} of {data.pages}</span>
          <div className="flex gap-2">
            <button type="button" disabled={data.page <= 1 || loading} onClick={() => set({ page: data.page - 1 })} className="rounded-full border border-white/15 px-4 py-1.5 text-white/85 hover:border-white/30 disabled:opacity-40">
              Previous
            </button>
            <button type="button" disabled={data.page >= data.pages || loading} onClick={() => set({ page: data.page + 1 })} className="rounded-full border border-white/15 px-4 py-1.5 text-white/85 hover:border-white/30 disabled:opacity-40">
              Next
            </button>
          </div>
        </nav>
      )}

      {selected && (
        <ApplicationDrawer
          id={selected}
          onClose={closeDrawer}
          onChanged={() => {
            setTick((t) => t + 1);
            onChanged();
          }}
        />
      )}
    </section>
  );
}   