"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import {
  DEFAULT_FILTERS,
  type OrderFilters,
  type OrderStats,
  type RiderRow,
} from "@/lib/admin-orders";
import { COMPARE_LABELS, RANGE_LABELS, formatRangeSpan, type RangeKey } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { AddAccountModal } from "./AddAccountModal";
import { TileSkeleton } from "./BusinessTiles";
import { OrderDrawer } from "./OrderDrawer";
import { OrderList } from "./OrderList";
import { OrderStatsView } from "./OrderStatsView";
import { RangeToolbar } from "./RangeToolBar";
import { RidersPanel } from "./RidersPanel";
import { ErrorBanner } from "./ui";
import { useAdminStat, useRangeState } from "./use-admin-stat";

const SKELETON = ["", "", "", "", "md:col-span-2 min-h-[20rem]", "", ""];

export function OrdersPage({ initialRange }: { initialRange: RangeKey }) {
  const [range, setRange] = useRangeState(initialRange);
  const { data, error, loading, updatedAt, refresh } = useAdminStat<OrderStats>(
    "/api/admin/orders/stats",
    range,
  );

  const [filters, setFilters] = React.useState<OrderFilters>(DEFAULT_FILTERS);
  const [listVersion, setListVersion] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [addingRider, setAddingRider] = React.useState(false);
  const listRef = React.useRef<HTMLDivElement>(null);

  const [riders, setRiders] = React.useState<RiderRow[] | null>(null);
  const [ridersError, setRidersError] = React.useState<string | null>(null);

  const loadRiders = React.useCallback(async () => {
    const r = await adminApi<{ riders: RiderRow[] }>("/api/admin/riders");
    if (r.ok && r.data.riders) {
      setRiders(r.data.riders);
      setRidersError(null);
    } else {
      setRidersError("We couldn't load the riders.");
    }
  }, []);

  React.useEffect(() => {
    void loadRiders();
  }, [loadRiders]);

  const changed = React.useCallback(() => {
    setListVersion((v) => v + 1);
    refresh();
    void loadRiders();
  }, [refresh, loadRiders]);

  const focusList = React.useCallback((preset: Partial<OrderFilters>) => {
    setFilters({ ...DEFAULT_FILTERS, ...preset });
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const closeDrawer = React.useCallback(() => setSelected(null), []);
  const closeAdd = React.useCallback(() => setAddingRider(false), []);

  const stale = loading && data?.range.key !== range;
  const compare = COMPARE_LABELS[range];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Orders</h1>
          <p className="mt-1.5 text-sm text-white/60">
            {data && data.range.key === range
              ? `${RANGE_LABELS[range]} · ${formatRangeSpan(data.range)} (Philippine time)`
              : RANGE_LABELS[range]}
          </p>
        </div>
        <RangeToolbar
          range={range}
          onChange={setRange}
          loading={loading}
          updatedAt={updatedAt}
          onRefresh={refresh}
        />
      </header>

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      <div
        aria-busy={stale}
        className={cn(
          "grid gap-4 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-4",
          stale && "opacity-60",
        )}
      >
        {data ? (
          <OrderStatsView data={data} compare={compare} onFocus={focusList} />
        ) : (
          SKELETON.map((cls, i) => <TileSkeleton key={i} className={cls} />)
        )}
      </div>

      <div ref={listRef} className="scroll-mt-6">
        <OrderList
          filters={filters}
          onFilters={setFilters}
          riders={riders ?? []}
          reloadKey={listVersion}
          onOpen={setSelected}
        />
      </div>

      <RidersPanel
        riders={riders}
        error={ridersError}
        onAdd={() => setAddingRider(true)}
        onChanged={changed}
      />

      {selected && (
        <OrderDrawer id={selected} riders={riders ?? []} onClose={closeDrawer} onChanged={changed} />
      )}
      {addingRider && (
        <AddAccountModal
          initialRole="rider"
          onClose={closeAdd}
          onCreated={() => {
            setAddingRider(false);
            changed();
          }}
        />
      )}
    </div>
  );
}

export default OrdersPage;