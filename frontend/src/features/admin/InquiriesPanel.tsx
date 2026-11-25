"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { InquiryList, InquiryRow, InquiryStatus } from "@/lib/admin-engagement";
import { formatDateTime } from "@/lib/admin-orders";
import { formatInt } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { InquiryStatusBadge } from "./badges";
import { CARD } from "./ui";

const SERVICES: [string, string][] = [
  ["all", "All services"],
  ["rentals", "Rentals for Catering Events"],
  ["financing", "Loans and Micro-financing"],
  ["savings-loans", "Savings and Loans"],
  ["production", "Manufacturing and Production"],
  ["contact-message", "General Contact Message"],
];

const SELECT =
  "min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50 [&>option]:bg-neutral-900";

const BTN = "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

type Filters = { status: string; service: string; search: string; page: number };

const NEXT_ACTIONS: Record<InquiryStatus, { to: InquiryStatus; label: string; tone: string }[]> = {
  new: [
    { to: "contacted", label: "Mark contacted", tone: "border-sky-300/40 text-sky-200 hover:bg-sky-400/10" },
    { to: "closed", label: "Close", tone: "border-white/25 text-white/80 hover:border-white/45" },
  ],
  contacted: [
    { to: "closed", label: "Close", tone: "border-emerald-300/40 text-emerald-200 hover:bg-emerald-400/10" },
    { to: "new", label: "Back to new", tone: "border-white/25 text-white/80 hover:border-white/45" },
  ],
  closed: [{ to: "new", label: "Reopen", tone: "border-white/25 text-white/80 hover:border-white/45" }],
};

function InquiryItem({ row, onStatus, busy }: { row: InquiryRow; onStatus: (id: string, s: InquiryStatus) => void; busy: boolean }) {
  const [open, setOpen] = React.useState(false);
  const long = row.message.length > 180;

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-white">{row.fullName}</span>
            <InquiryStatusBadge status={row.status} />
          </p>
          <p className="mt-0.5 text-xs text-[#f4d587]">{row.serviceLabel}</p>
          <p className="mt-1 text-xs text-white/55">
            <a href={`mailto:${row.email}`} className="hover:text-white hover:underline">
              {row.email}
            </a>
            {" · "}
            <a href={`tel:${row.phone}`} className="hover:text-white hover:underline">
              {row.phone}
            </a>
            {" · "}
            {formatDateTime(row.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {NEXT_ACTIONS[row.status].map((a) => (
            <button key={a.to} type="button" disabled={busy} onClick={() => onStatus(row.id, a.to)} className={cn(BTN, a.tone)}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <p className={cn("mt-3 whitespace-pre-line text-sm leading-relaxed text-white/80", !open && "line-clamp-3")}>
        {row.message}
      </p>
      {long && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-xs font-semibold text-[#f4d587] hover:underline">
          {open ? "Show less" : "Show more"}
        </button>
      )}
    </li>
  );
}

export function InquiriesPanel({ onChanged }: { onChanged: () => void }) {
  const [filters, setFilters] = React.useState<Filters>({ status: "open", service: "all", search: "", page: 1 });
  const [searchInput, setSearchInput] = React.useState("");
  const [data, setData] = React.useState<InquiryList | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const next = searchInput.trim();
    if (next === filters.search) return;
    const id = setTimeout(() => setFilters((f) => ({ ...f, search: next, page: 1 })), 300);
    return () => clearTimeout(id);
  }, [searchInput, filters.search]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams({ status: filters.status, service: filters.service, search: filters.search, page: String(filters.page) });
    (async () => {
      try {
        const r = await adminApi<InquiryList>(`/api/admin/inquiries?${qs}`, { signal: ctrl.signal });
        if (r.ok) {
          setData(r.data as InquiryList);
          setError(null);
        } else setError("We couldn't load the inquiries.");
      } catch {
        return;
      }
      setLoading(false);
    })();
    return () => ctrl.abort();
  }, [filters, tick]);

  async function setStatus(id: string, status: InquiryStatus) {
    if (busyId) return;
    setBusyId(id);
    const r = await adminApi(`/api/admin/inquiries/${id}/status`, { method: "PATCH", body: { status } });
    setBusyId(null);
    if (!r.ok) {
      setError(r.data.message ?? "We couldn't update that inquiry.");
      return;
    }
    setTick((t) => t + 1);
    onChanged();
  }

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 }));
  const chips: [string, string, number | undefined][] = [
    ["open", "Open", data?.counts.open],
    ["new", "New", data?.counts.new],
    ["contacted", "Contacted", data?.counts.contacted],
    ["closed", "Closed", data?.counts.closed],
    ["all", "All", data?.counts.all],
  ];

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Inquiries">
      <h2 className="text-lg font-semibold text-white">Inquiries</h2>
      <p className="mt-1 text-sm text-white/60">Messages from the contact page and the service forms.</p>

      <div role="group" aria-label="Inquiry status" className="-mx-1 mt-5 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
          <span className="sr-only">Search inquiries</span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or phone"
            className="min-h-10 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50"
          />
        </label>
        <select aria-label="Service" value={filters.service} onChange={(e) => set({ service: e.target.value })} className={SELECT}>
          {SERVICES.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <div aria-busy={loading && !!data} className={cn("mt-2 transition-opacity", loading && data && "opacity-60")}>
        {!data ? (
          <div className="mt-3 space-y-2" aria-hidden>
            {[0, 1, 2].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : data.inquiries.length === 0 ? (
          <p className="px-2 py-10 text-center text-sm text-white/55">
            {data.counts.all === 0 ? "No inquiries yet." : "No inquiries match these filters."}
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data.inquiries.map((row) => (
              <InquiryItem key={row.id} row={row} onStatus={setStatus} busy={busyId === row.id} />
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
    </section>
  );
}