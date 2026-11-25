"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InventoryStats, StockFilter } from "@/lib/admin-products";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { MetricFooter, Note, Tile, Value } from "./BusinessTiles";
import { ChangePill, CARD } from "./ui";

const GOLD = "#efc673";
const TICK = { fill: "rgba(255,255,255,0.55)", fontSize: 12 };

const LinkBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-xs font-semibold text-[#f4d587] underline-offset-4 hover:underline"
  >
    {children}
  </button>
);

const daysText = (d: number | null) =>
  d === null ? "No recent sales to estimate from" : d <= 1 ? "About a day left" : `About ${formatInt(d)} days left`;

export function InventoryStatsView({
  data,
  compare,
  onFilter,
  onRestock,
}: {
  data: InventoryStats;
  compare: string;
  onFilter: (f: StockFilter) => void;
  onRestock: (id: number) => void;
}) {
  const s = data.summary;
  const maxUnits = Math.max(1, ...data.demand.map((d) => d.units));
  const hasSales = data.series.some((p) => p.units > 0);
  const chart = data.series.map((p) => ({ label: p.label, units: p.future ? null : p.units }));

  return (
    <>
      <Tile
        label="Products"
        description="Products in the catalog (deleted ones excluded)"
        footer={
          <Note>
            {formatInt(s.published)} visible · {formatInt(s.hidden)} hidden
          </Note>
        }
      >
        <Value size="lg">{formatInt(s.products)}</Value>
      </Tile>

      <Tile
        label="Units in stock"
        description="Total units across all products"
        footer={<Note>Retail value {formatPeso(s.value)}</Note>}
      >
        <Value size="lg">{formatInt(s.units)}</Value>
      </Tile>

      <Tile
        label="Low stock"
        description="Visible products at or below their low-stock level"
        footer={<LinkBtn onClick={() => onFilter("low")}>View low-stock products</LinkBtn>}
      >
        <Value size="lg" className={s.low > 0 ? "text-amber-300" : undefined}>
          {formatInt(s.low)}
        </Value>
      </Tile>

      <Tile
        label="Out of stock"
        description="Visible products that can't be ordered right now"
        footer={<LinkBtn onClick={() => onFilter("out")}>View out-of-stock products</LinkBtn>}
      >
        <Value size="lg" className={s.out > 0 ? "text-red-400" : undefined}>
          {formatInt(s.out)}
        </Value>
      </Tile>

      {/* Units ordered over time */}
      <article className={cn(CARD, "flex min-h-[20rem] flex-col p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Units ordered</h3>
        <p className="mt-1 text-sm text-white/60">Units in orders placed in this range (cancelled excluded).</p>
        <div className="mt-4 min-h-56 w-full min-w-0 flex-1">
          {!hasSales ? (
            <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/55">
              No orders in this period yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={224}>
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="invUnits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={TICK} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                  contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12 }}
                  labelStyle={{ color: "#fff", fontWeight: 600 }}
                  itemStyle={{ color: "rgba(255,255,255,0.85)" }}
                />
                <Area type="monotone" dataKey="units" name="Units" stroke={GOLD} strokeWidth={2} fill="url(#invUnits)" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>

      {/* Needs restocking */}
      <article className={cn(CARD, "p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Needs restocking</h3>
        <p className="mt-1 text-sm text-white/60">Out of stock first, then the lowest levels.</p>
        {data.attention.length === 0 ? (
          <p className="mt-6 text-sm text-white/55">Every visible product is comfortably in stock.</p>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {data.attention.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || "/products.png"} alt="" className="size-10 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                  <p className={cn("text-xs", p.status === "out" ? "text-red-300" : "text-amber-300")}>
                    {p.status === "out"
                      ? "Out of stock"
                      : `${formatInt(p.stock)} left (alert at ${formatInt(p.lowStockThreshold)})`}
                    {p.status === "low" && <span className="text-white/45"> · {daysText(p.daysLeft)}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRestock(p.id)}
                  className="shrink-0 rounded-full border border-[#c8933a] px-3.5 py-1.5 text-xs font-semibold text-[#f4d587] transition-colors hover:bg-[#c8933a]/15"
                >
                  Restock
                </button>
              </li>
            ))}
          </ul>
        )}
      </article>

      {/* Product demand */}
      <article className={cn(CARD, "p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Product demand</h3>
        <p className="mt-1 text-sm text-white/60">Most ordered products in this range.</p>
        {data.demand.length === 0 ? (
          <p className="mt-6 text-sm text-white/55">No orders in this period yet.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {data.demand.map((d, i) => (
              <li key={d.id}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="w-4 shrink-0 text-xs tabular-nums text-white/40">{i + 1}</span>
                    <span className="truncate text-white/90">{d.name}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-white">{formatInt(d.units)} units</span>
                </div>
                <div className="ml-6 mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#efc673]" style={{ width: `${(d.units / maxUnits) * 100}%` }} />
                </div>
                <div className="ml-6 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
                  <span>{formatInt(d.stock)} in stock</span>
                  <ChangePill change={d.change} label={compare} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </article>

      <Tile
        label="Units ordered"
        description="Units in orders placed in this range"
        footer={<MetricFooter metric={data.unitsOrdered} compare={compare} />}
      >
        <Value size="lg">{formatInt(data.unitsOrdered.value)}</Value>
      </Tile>

      <Tile
        label="No orders in range"
        description="Visible products nobody ordered in this range"
        footer={<Note>Slow movers, worth a promotion or a look</Note>}
      >
        <Value size="lg">{formatInt(data.noSales)}</Value>
      </Tile>
    </>
  );
}