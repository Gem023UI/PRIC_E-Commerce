"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { AdminProduct, InventoryStats, StockFilter } from "@/lib/admin-products";
import { COMPARE_LABELS, RANGE_LABELS, formatRangeSpan, type RangeKey } from "@/lib/admin-stats";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { TileSkeleton } from "./BusinessTiles";
import { InventoryStatsView } from "./InventoryStatsView";
import { ProductFormModal } from "./ProductFormModal";
import { ProductTable } from "./ProductTable";
import { RangeToolbar } from "./RangeToolBar";
import { StockModal } from "./StockModal";
import { ErrorBanner } from "./ui";
import { useAdminStat, useRangeState } from "./use-admin-stat";

type Notice = { type: "success" | "error"; message: string } | null;

const SKELETON = ["", "", "", "", "md:col-span-2 min-h-[20rem]", "md:col-span-2 min-h-[20rem]", "md:col-span-2", "", ""];

export function InventoryPage({ initialRange }: { initialRange: RangeKey }) {
  const [range, setRange] = useRangeState(initialRange);
  const { data, error, loading, updatedAt, refresh } = useAdminStat<InventoryStats>(
    "/api/admin/products/stats",
    range,
  );

  const [products, setProducts] = React.useState<AdminProduct[] | null>(null);
  const [productsError, setProductsError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<StockFilter>("all");
  const [editing, setEditing] = React.useState<AdminProduct | "new" | null>(null);
  const [stocking, setStocking] = React.useState<AdminProduct | null>(null);
  const [notice, setNotice] = React.useState<Notice>(null);
  const tableRef = React.useRef<HTMLDivElement>(null);

  const loadProducts = React.useCallback(async () => {
    const r = await adminApi<{ products: AdminProduct[] }>("/api/admin/products");
    if (r.ok && r.data.products) {
      setProducts(r.data.products);
      setProductsError(null);
    } else {
      setProductsError("We couldn't load the products.");
    }
  }, []);

  React.useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const changed = React.useCallback(() => {
    void loadProducts();
    refresh();
  }, [loadProducts, refresh]);

  const focusTable = React.useCallback((f: StockFilter) => {
    setFilter(f);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const restock = React.useCallback(
    (id: number) => {
      const p = products?.find((x) => x.id === id);
      if (p) setStocking(p);
    },
    [products],
  );

  const closeEdit = React.useCallback(() => setEditing(null), []);
  const closeStock = React.useCallback(() => setStocking(null), []);

  const stale = loading && data?.range.key !== range;
  const compare = COMPARE_LABELS[range];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Products &amp; inventory</h1>
            <p className="mt-1.5 text-sm text-white/60">
              {data && data.range.key === range
                ? `${RANGE_LABELS[range]} · ${formatRangeSpan(data.range)} (Philippine time)`
                : RANGE_LABELS[range]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-black shadow-lg transition-transform hover:scale-[1.03]"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            Add product
          </button>
        </div>
        <RangeToolbar range={range} onChange={setRange} loading={loading} updatedAt={updatedAt} onRefresh={refresh} />
      </header>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm",
            notice.type === "error"
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
          )}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 rounded-full px-2 text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      <div
        aria-busy={stale}
        className={cn(
          "grid gap-4 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-4",
          stale && "opacity-60",
        )}
      >
        {data ? (
          <InventoryStatsView data={data} compare={compare} onFilter={focusTable} onRestock={restock} />
        ) : (
          SKELETON.map((cls, i) => <TileSkeleton key={i} className={cls} />)
        )}
      </div>

      <div ref={tableRef} className="scroll-mt-6">
        <ProductTable
          products={products}
          error={productsError}
          filter={filter}
          onFilter={setFilter}
          onEdit={setEditing}
          onStock={setStocking}
          onChanged={changed}
          onNotice={setNotice}
        />
      </div>

      {editing && (
        <ProductFormModal
          product={editing === "new" ? undefined : editing}
          onClose={closeEdit}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ type: "success", message });
            changed();
          }}
        />
      )}
      {stocking && (
        <StockModal
          product={stocking}
          onClose={closeStock}
          onSaved={(message) => {
            setStocking(null);
            setNotice({ type: "success", message });
            changed();
          }}
        />
      )}
    </div>
  );
}

export default InventoryPage;