"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompact, formatInt, formatPeso, type Business } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { CARD } from "./ui";

type Mode = "sales" | "orders" | "units";

const MODES: { key: Mode; label: string }[] = [
  { key: "sales", label: "Sales" },
  { key: "orders", label: "Orders" },
  { key: "units", label: "Units" },
];

const GOLD = "#efc673";
const BLUE = "#7dd3fc";
const TICK = { fill: "rgba(255,255,255,0.55)", fontSize: 12 };

export function SalesTrendChart({
  series,
  hasData,
  className,
}: {
  series: Business["series"];
  hasData: boolean;
  className?: string;
}) {
  const [mode, setMode] = React.useState<Mode>("sales");

  // Future buckets become null so the lines stop at the present moment.
  const data = series.map((p) => ({
    label: p.label,
    gross: p.future ? null : p.grossSales,
    net: p.future ? null : p.netSales,
    orders: p.future ? null : p.orders,
    units: p.future ? null : p.units,
  }));

  const isSales = mode === "sales";

  return (
    <article className={cn(CARD, "flex min-h-[22rem] flex-col p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Sales trend</h3>
          <p className="mt-1 text-sm text-white/60">Completed orders, by when they were completed.</p>
        </div>
        <div
          role="group"
          aria-label="Chart metric"
          className="inline-flex rounded-full border border-white/15 bg-white/5 p-1"
        >
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={mode === m.key}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#efc673]",
                mode === m.key ? "bg-white/15 text-white" : "text-white/60 hover:text-white",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isSales && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/70">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: GOLD }} />
            Net sales
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: BLUE }} />
            Gross sales
          </span>
        </div>
      )}

      <div className="mt-3 min-h-64 w-full min-w-0 flex-1">
        {!hasData ? (
          <div className="flex h-full min-h-64 items-center justify-center rounded-xl border border-dashed border-white/10 text-center text-sm text-white/55">
            No completed orders in this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={256}>
            <AreaChart key={mode} data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <defs>
                <linearGradient id="bizArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
              <YAxis
                allowDecimals={false}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={isSales ? 58 : 42}
                tickFormatter={(v: number) => (isSales ? `₱${formatCompact(v)}` : formatInt(v))}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.2)" }}
                contentStyle={{
                  background: "#0a0a0a",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                itemStyle={{ color: "rgba(255,255,255,0.85)" }}
                formatter={(value) =>
                  isSales ? formatPeso(Number(value)) : formatInt(Number(value))
                }
              />
              {isSales ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="gross"
                    name="Gross sales"
                    stroke={BLUE}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    fill="none"
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    name="Net sales"
                    stroke={GOLD}
                    strokeWidth={2}
                    fill="url(#bizArea)"
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                  />
                </>
              ) : (
                <Area
                  type="monotone"
                  dataKey={mode}
                  name={mode === "orders" ? "Completed orders" : "Units sold"}
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#bizArea)"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}