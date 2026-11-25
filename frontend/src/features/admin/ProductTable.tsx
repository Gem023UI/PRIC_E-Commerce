"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { AdminProduct, StockFilter } from "@/lib/admin-products";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { StockBadge } from "./Badges";
import { CARD } from "./ui";

const SELECT =
  "min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50 [&>option]:bg-neutral-900";

const SORTS: [string, string][] = [
  ["name", "Name A–Z"],
  ["stock", "Lowest stock"],
  ["demand", "Best selling (30 days)"],
  ["price", "Highest price"],
  ["newest", "Newest first"],
];

const SORTERS: Record<string, (a: AdminProduct, b: AdminProduct) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  stock: (a, b) => a.stock - b.stock || a.name.localeCompare(b.name),
  demand: (a, b) => b.sold30 - a.sold30 || a.name.localeCompare(b.name),
  price: (a, b) => b.price - a.price,
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
};

const BTN = "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

export function ProductTable({
  products,
  error,
  filter,
  onFilter,
  onEdit,
  onStock,
  onChanged,
  onNotice,
}: {
  products: AdminProduct[] | null;
  error: string | null;
  filter: StockFilter;
  onFilter: (f: StockFilter) => void;
  onEdit: (p: AdminProduct) => void;
  onStock: (p: AdminProduct) => void;
  onChanged: () => void;
  onNotice: (n: { type: "success" | "error"; message: string }) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [sort, setSort] = React.useState("name");
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [confirmId, setConfirmId] = React.useState<number | null>(null);

  const counts = React.useMemo(() => {
    const list = products ?? [];
    const visible = list.filter((p) => p.published);
    return {
      all: list.length,
      ok: visible.filter((p) => p.status === "ok").length,
      low: visible.filter((p) => p.status === "low").length,
      out: visible.filter((p) => p.status === "out").length,
      hidden: list.length - visible.length,
    };
  }, [products]);

  const rows = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (products ?? [])
      .filter((p) => {
        if (filter === "hidden") return !p.published;
        if (filter !== "all" && (!p.published || p.status !== filter)) return false;
        return !needle || p.name.toLowerCase().includes(needle);
      })
      .sort(SORTERS[sort] ?? SORTERS.name!);
  }, [products, filter, search, sort]);

  async function run(id: number, call: () => ReturnType<typeof adminApi>, success: string) {
    if (busyId !== null) return;
    setBusyId(id);
    const r = await call();
    setBusyId(null);
    setConfirmId(null);
    if (!r.ok) {
      onNotice({ type: "error", message: r.data.message ?? "Something went wrong. Please try again." });
      return;
    }
    onNotice({ type: "success", message: success });
    onChanged();
  }

  const chips: [StockFilter, string, number][] = [
    ["all", "All", counts.all],
    ["ok", "In stock", counts.ok],
    ["low", "Low stock", counts.low],
    ["out", "Out of stock", counts.out],
    ["hidden", "Hidden", counts.hidden],
  ];

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Products">
      <h2 className="text-lg font-semibold text-white">All products</h2>
      <p className="mt-1 text-sm text-white/60">
        {products ? `${formatInt(rows.length)} shown` : "Loading…"}
      </p>

      <div
        role="group"
        aria-label="Stock filter"
        className="-mx-1 mt-5 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {chips.map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => onFilter(value)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]",
              filter === value
                ? "border-[#efc673]/60 bg-[#efc673]/15 font-semibold text-[#f4d587]"
                : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white",
            )}
          >
            {label} <span className="ml-1 tabular-nums text-white/50">{formatInt(count)}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <label className="min-w-[14rem] flex-1">
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="min-h-10 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50"
          />
        </label>
        <select aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} className={SELECT}>
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

      {!products ? (
        <div className="mt-5 space-y-2" aria-hidden>
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="px-2 py-10 text-center text-sm text-white/55">
          {products.length === 0
            ? "No products yet. Add your first product, or run the product seed script."
            : "No products match these filters."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
              <div className="flex min-w-[15rem] flex-1 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || "/products.png"} alt="" className="size-14 shrink-0 rounded-lg bg-white/5 object-contain" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                  <p className="text-sm tabular-nums text-white/70">{formatPeso(p.price)}</p>
                </div>
              </div>

              <div className="w-40 shrink-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StockBadge status={p.status} />
                  {!p.published && (
                    <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white/60">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm tabular-nums text-white">
                  {formatInt(p.stock)} <span className="text-xs text-white/50">in stock</span>
                </p>
                <p className="text-xs text-white/50">
                  {formatInt(p.sold30)} ordered (30 days)
                  {p.daysLeft !== null && p.status !== "ok" && ` · ~${formatInt(p.daysLeft)}d left`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onStock(p)}
                  className={cn(BTN, "border-[#c8933a] text-[#f4d587] hover:bg-[#c8933a]/15")}
                >
                  Stock
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(p)}
                  className={cn(BTN, "border-white/25 text-white/85 hover:border-white/45")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() =>
                    run(
                      p.id,
                      () => adminApi(`/api/admin/products/${p.id}`, { method: "PATCH", body: { published: !p.published } }),
                      p.published ? `${p.name} is now hidden from the site.` : `${p.name} is now visible on the site.`,
                    )
                  }
                  className={cn(BTN, "border-white/25 text-white/85 hover:border-white/45")}
                >
                  {p.published ? "Hide" : "Show"}
                </button>
                {confirmId === p.id ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() =>
                        run(p.id, () => adminApi(`/api/admin/products/${p.id}`, { method: "DELETE" }), `${p.name} was deleted.`)
                      }
                      className={cn(BTN, "border-transparent bg-red-500/90 text-white hover:bg-red-500")}
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className={cn(BTN, "border-white/20 text-white/80 hover:border-white/40")}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(p.id)}
                    className={cn(BTN, "border-red-300/40 text-red-200 hover:bg-red-400/10")}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}