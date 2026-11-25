"use client";

import {
  COMPARE_LABELS,
  RANGE_LABELS,
  formatInt,
  formatPeso,
  formatRangeSpan,
  type Overview,
  type RangeKey,
} from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { DateRangeFilter } from "./DateRangeFilter";
import { ChatIcon, ClockIcon, CubeIcon, BagIcon, RefreshIcon, UsersIcon, WalletIcon } from "./icons";
import { FootNote, KpiCard, KpiSkeleton } from "./KpiCard";
import { ChangePill, ErrorBanner, PageHeader } from "./ui";
import { useAdminStat, useRangeState } from "./use-admin-stat";
import { VisitsPanel, VisitsSkeleton } from "./VisitsPanel";

const time = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});

export function OverviewPage({ initialRange }: { initialRange: RangeKey }) {
  const [range, setRange] = useRangeState(initialRange);
  const { data, error, loading, updatedAt, refresh } = useAdminStat<Overview>(
    "/api/admin/stats/overview",
    range,
  );

  // The numbers on screen belong to an earlier range while the new one loads.
  const stale = loading && data?.range.key !== range;
  const compare = COMPARE_LABELS[range];
  const k = data?.kpis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle={
          data && data.range.key === range
            ? `${RANGE_LABELS[range]} · ${formatRangeSpan(data.range)} (Philippine time)`
            : RANGE_LABELS[range]
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DateRangeFilter value={range} onChange={setRange} />
          <div className="flex items-center gap-3 text-xs text-white/50">
            {updatedAt && <span>Updated {time.format(updatedAt)}</span>}
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Refresh numbers"
              className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
            >
              <RefreshIcon className={cn("size-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </PageHeader>

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      <div
        aria-busy={stale}
        className={cn("space-y-6 transition-opacity duration-200", stale && "opacity-60")}
      >
        <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {!k ? (
            Array.from({ length: 6 }, (_, i) => <KpiSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                icon={<WalletIcon />}
                iconClassName="text-emerald-400"
                badge="Financial"
                value={formatPeso(k.revenue.value)}
                title="Total Sales Revenue"
                description="Completed and recognized product sales within the selected period"
                footer={<ChangePill change={k.revenue.change} label={compare} />}
              />
              <KpiCard
                icon={<BagIcon />}
                value={formatInt(k.orders.value)}
                title="Total Orders"
                description="Number of orders placed within the selected period"
                footer={<ChangePill change={k.orders.change} label={compare} />}
              />
              <KpiCard
                icon={<UsersIcon />}
                value={formatInt(k.customers.total)}
                title="Registered Customers"
                description="Total customer accounts registered on the platform"
                footer={
                  <FootNote>
                    {k.customers.newInPeriod > 0
                      ? `+${formatInt(k.customers.newInPeriod)} new in the selected range`
                      : "No new accounts in the selected range"}
                  </FootNote>
                }
              />
              <KpiCard
                icon={<CubeIcon />}
                value={formatInt(k.products.total)}
                title="Available Products"
                description="Products currently published and available for purchase"
                footer={
                  <FootNote>
                    {k.products.newInPeriod > 0
                      ? `+${formatInt(k.products.newInPeriod)} added in the selected range`
                      : "Published products in your catalog"}
                  </FootNote>
                }
              />
              <KpiCard
                icon={<ClockIcon />}
                iconClassName="text-orange-500"
                value={formatInt(k.pendingOrders.current)}
                title="Pending Orders"
                description="Orders awaiting confirmation, payment verification, or processing"
                footer={
                  <FootNote>
                    {formatInt(k.pendingOrders.receivedInPeriod)} received in the selected range
                  </FootNote>
                }
              />
              <KpiCard
                icon={<ChatIcon />}
                value={formatInt(k.pendingInquiries.current)}
                title="Pending Inquiries"
                description="Unresolved customer and service inquiries"
                footer={
                  <FootNote>
                    {formatInt(k.pendingInquiries.receivedInPeriod)} received in the selected range
                  </FootNote>
                }
              />
            </>
          )}
        </section>

        {data ? <VisitsPanel visits={data.visits} compareLabel={compare} /> : <VisitsSkeleton />}
      </div>
    </div>
  );
}

export default OverviewPage;