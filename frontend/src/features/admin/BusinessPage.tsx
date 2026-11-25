"use client";

import {
  COMPARE_LABELS,
  RANGE_LABELS,
  formatInt,
  formatPercent,
  formatPeso,
  formatRangeSpan,
  type Business,
  type RangeKey,
} from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { PaymentMixTile, ProductSpotlightTile, TopProductsTile } from "./BusinessBreakdowns";
import { MetricFooter, Note, Tile, TileSkeleton, Value } from "./BusinessTiles";
import { RangeToolbar } from "./RangeToolBar";
import { SalesTrendChart } from "./SalesTrendChart";
import { ErrorBanner, PageHeader } from "./ui";
import { useAdminStat, useRangeState } from "./use-admin-stat";

// Placeholder tile shapes, in the same order and spans as the real bento.
const SKELETON = [
  "md:col-span-2",
  "",
  "",
  "md:col-span-2 lg:col-span-3 lg:row-span-2 min-h-[22rem]",
  "",
  "",
  "",
  "",
  "",
  "",
  "lg:col-span-2",
  "lg:col-span-2",
  "md:col-span-2",
  "md:col-span-2",
];

const plural = (n: number, one: string) => `${formatInt(n)} ${n === 1 ? one : `${one}s`}`;

export function BusinessPage({ initialRange }: { initialRange: RangeKey }) {
  const [range, setRange] = useRangeState(initialRange);
  const { data, error, loading, updatedAt, refresh } = useAdminStat<Business>(
    "/api/admin/stats/business",
    range,
  );

  // The numbers on screen belong to an earlier range while the new one loads.
  const stale = loading && data?.range.key !== range;
  const compare = COMPARE_LABELS[range];
  const m = data?.metrics;
  const hasSales = !!m && m.transactions.value > 0;

  const growth = m?.salesGrowth;
  const growthTone =
    growth?.value == null || growth.value === 0
      ? "text-white"
      : growth.value > 0
        ? "text-emerald-400"
        : "text-red-400";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business performance"
        subtitle={
          data && data.range.key === range
            ? `${RANGE_LABELS[range]} · ${formatRangeSpan(data.range)} (Philippine time)`
            : RANGE_LABELS[range]
        }
      >
        <RangeToolbar
          range={range}
          onChange={setRange}
          loading={loading}
          updatedAt={updatedAt}
          onRefresh={refresh}
        />
      </PageHeader>

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {m && !hasSales && (
        <p
          role="status"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70"
        >
          No completed orders in this period yet. Sales figures count orders that have been marked{" "}
          <span className="font-semibold text-white">Completed</span>.
        </p>
      )}

      <div
        aria-busy={stale}
        className={cn(
          "grid gap-4 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-4",
          stale && "opacity-60",
        )}
      >
        {!data || !m || !growth ? (
          SKELETON.map((cls, i) => <TileSkeleton key={i} className={cls} />)
        ) : (
          <>
            <Tile
              label="Net sales"
              description="Sales after applicable discounts, refunds, and adjustments"
              className="md:col-span-2"
              footer={<MetricFooter metric={m.netSales} compare={compare} />}
            >
              <Value size="xl">{formatPeso(m.netSales.value)}</Value>
              <p className="mt-3 text-xs tabular-nums text-white/55">
                Gross {formatPeso(m.grossSales.value)} − Discounts {formatPeso(m.discounts.value)} −
                Refunds {formatPeso(m.refunds.value)}
              </p>
            </Tile>

            <Tile
              label="Gross sales"
              description="Total value of product sales before deductions"
              footer={<MetricFooter metric={m.grossSales} compare={compare} />}
            >
              <Value size="lg">{formatPeso(m.grossSales.value)}</Value>
            </Tile>

            <Tile
              label="Sales growth rate"
              description="Percentage increase or decrease in sales"
              footer={
                <Note>
                  {growth.value === null
                    ? "Nothing earlier to compare with"
                    : `Compared with ${compare.replace(/^vs\.? /, "")}: ${formatPeso(growth.previous)}`}
                </Note>
              }
            >
              <Value size="lg" className={growthTone}>
                {growth.value === null
                  ? "—"
                  : `${growth.value > 0 ? "+" : growth.value < 0 ? "−" : ""}${formatPercent(growth.value)}`}
              </Value>
            </Tile>

            <SalesTrendChart
              series={data.series}
              hasData={hasSales}
              className="md:col-span-2 lg:col-span-3 lg:row-span-2"
            />

            <Tile
              label="Average order value"
              description="Average amount spent per completed order"
              footer={<MetricFooter metric={m.averageOrderValue} compare={compare} />}
            >
              <Value>{formatPeso(m.averageOrderValue.value)}</Value>
            </Tile>

            <Tile
              label="Total transactions"
              description="Number of successfully completed purchases"
              footer={<MetricFooter metric={m.transactions} compare={compare} />}
            >
              <Value>{formatInt(m.transactions.value)}</Value>
            </Tile>

            <Tile
              label="Total units sold"
              description="Combined quantity of products purchased"
              footer={<MetricFooter metric={m.unitsSold} compare={compare} />}
            >
              <Value>{formatInt(m.unitsSold.value)}</Value>
            </Tile>

            <Tile
              label="Total discounts"
              description="Value of discounts applied to orders"
              footer={
                <MetricFooter
                  metric={m.discounts}
                  compare={compare}
                  goodWhen="down"
                  emptyNote="None recorded in this period or the one before"
                />
              }
            >
              <Value>{formatPeso(m.discounts.value)}</Value>
            </Tile>

            <Tile
              label="Total refunds"
              description="Amount refunded to customers"
              footer={
                <MetricFooter
                  metric={m.refunds}
                  compare={compare}
                  goodWhen="down"
                  emptyNote="None recorded in this period or the one before"
                />
              }
            >
              <Value>{formatPeso(m.refunds.value)}</Value>
            </Tile>

            <Tile
              label="Outstanding payments"
              description="Amount awaiting payment or verification"
              footer={
                <Note>
                  {formatPeso(m.outstandingPayments.placedInPeriod.amount)} from{" "}
                  {plural(m.outstandingPayments.placedInPeriod.orders, "order")} placed in this
                  range
                </Note>
              }
            >
              <Value className="text-orange-400">{formatPeso(m.outstandingPayments.amount)}</Value>
              <p className="mt-2 text-xs text-white/55">
                {plural(m.outstandingPayments.orders, "order")} unpaid
                {m.outstandingPayments.awaitingVerification > 0 &&
                  ` · ${formatInt(m.outstandingPayments.awaitingVerification)} awaiting verification`}
              </p>
            </Tile>

            <ProductSpotlightTile
              label="Best-selling product"
              description="Product generating the highest sales volume"
              product={m.bestSeller}
              highlight="units"
              className="lg:col-span-2"
            />
            <ProductSpotlightTile
              label="Highest revenue product"
              description="Product generating the highest sales value"
              product={m.highestRevenueProduct}
              highlight="revenue"
              className="lg:col-span-2"
            />

            <TopProductsTile products={data.topProducts} className="md:col-span-2" />
            <PaymentMixTile mix={data.paymentMix} className="md:col-span-2" />
          </>
        )}
      </div>

      <details className="group rounded-2xl border border-white/10 bg-black px-5 py-4 text-sm text-white/70">
        <summary className="cursor-pointer select-none font-medium text-white/85 marker:text-white/40">
          How these numbers are calculated
        </summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed">
          <li>
            Sales only count orders marked <strong className="text-white">Completed</strong>, dated
            by when they were completed.
          </li>
          <li>
            Gross sales is the sum of item subtotals (shipping fees are excluded). Net sales is gross
            sales minus discounts and refunds.
          </li>
          <li>Average order value is net sales divided by the number of completed orders.</li>
          <li>
            Outstanding payments covers orders that aren&apos;t cancelled and are unpaid or awaiting
            verification, using the full order total including shipping. It is a live balance, not
            limited to the selected range.
          </li>
          <li>
            Sales growth compares net sales with the equally long earlier period shown beside each
            figure. In-progress ranges are compared over the same elapsed time.
          </li>
          <li>
            Discounts and refunds aren&apos;t recorded by the system yet, so they show PHP 0.00 for
            now.
          </li>
        </ul>
      </details>
    </div>
  );
}

export default BusinessPage;