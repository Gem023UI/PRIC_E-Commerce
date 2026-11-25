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

import { formatInt, type Visits } from "@/lib/admin-stats";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { CARD, ChangePill } from "./ui";

const VIEWS = "#efc673";
const PEOPLE = "#7dd3fc";

const DEVICES: Record<string, { label: string; color: string }> = {
  mobile: { label: "Mobile", color: "#efc673" },
  desktop: { label: "Desktop", color: "#7dd3fc" },
  tablet: { label: "Tablet", color: "#a78bfa" },
};

const TICK = { fill: "rgba(255,255,255,0.55)", fontSize: 12 };

const pageName = (path: string) => (path === "/" ? "Home (/)" : path);

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-w-[8.5rem]">
      <p className="text-xs uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{value}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function VisitsPanel({ visits, compareLabel }: { visits: Visits; compareLabel: string }) {
  const { pageViews, uniqueVisitors, pagesPerVisitor, series, topPages, devices } = visits;

  // Future buckets become null so the lines stop at the present moment.
  const data = series.map((p) => ({
    label: p.label,
    pageViews: p.future ? null : p.pageViews,
    uniqueVisitors: p.future ? null : p.uniqueVisitors,
  }));

  const maxViews = Math.max(1, ...topPages.map((p) => p.views));
  const deviceTotal = devices.reduce((s, d) => s + d.views, 0);

  return (
    <section className={cn(CARD, "p-5 md:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
        <div className="max-w-sm">
          <h2 className="text-lg font-semibold text-white">Site visits</h2>
          <p className="mt-1 text-sm text-white/60">
            Public pages only. Staff, riders and bots are not counted.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <Stat label="Page views" value={formatInt(pageViews.value)}>
            <ChangePill change={pageViews.change} label={compareLabel} />
          </Stat>
          <Stat label="Unique visitors" value={formatInt(uniqueVisitors.value)}>
            <ChangePill change={uniqueVisitors.change} label={compareLabel} />
          </Stat>
          <Stat label="Pages per visitor" value={pagesPerVisitor.toFixed(2)} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/70">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: VIEWS }} />
          Page views
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ background: PEOPLE }} />
          Unique visitors
        </span>
      </div>

      <div className="mt-3 h-64 w-full min-w-0 md:h-72">
        {pageViews.value === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/55">
            No visits recorded in this period yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="visitsViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIEWS} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={VIEWS} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="visitsPeople" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PEOPLE} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={PEOPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={TICK}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={TICK}
                tickLine={false}
                axisLine={false}
                width={44}
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
              />
              <Area
                type="monotone"
                dataKey="pageViews"
                name="Page views"
                stroke={VIEWS}
                strokeWidth={2}
                fill="url(#visitsViews)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="uniqueVisitors"
                name="Unique visitors"
                stroke={PEOPLE}
                strokeWidth={2}
                fill="url(#visitsPeople)"
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-8 grid gap-8 border-t border-white/10 pt-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Top pages</h3>
          {topPages.length === 0 ? (
            <p className="mt-4 text-sm text-white/55">No page views yet.</p>
          ) : (
            <ul className="mt-4 space-y-3.5">
              {topPages.map((p) => (
                <li key={p.path}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="truncate text-white/85">{pageName(p.path)}</span>
                    <span className="shrink-0 tabular-nums text-white/60">
                      {formatInt(p.views)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(p.views / maxViews) * 100}%`,
                        backgroundImage: GOLD_GRADIENT,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Devices</h3>
          {deviceTotal === 0 ? (
            <p className="mt-4 text-sm text-white/55">No page views yet.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/10">
                {devices.map((d) => (
                  <div
                    key={d.device}
                    title={`${DEVICES[d.device]?.label ?? d.device}: ${formatInt(d.views)}`}
                    style={{
                      width: `${(d.views / deviceTotal) * 100}%`,
                      background: DEVICES[d.device]?.color ?? "#999",
                    }}
                  />
                ))}
              </div>
              <ul className="mt-4 space-y-2.5">
                {devices.map((d) => (
                  <li key={d.device} className="flex items-center justify-between gap-4 text-sm">
                    <span className="inline-flex items-center gap-2 text-white/85">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: DEVICES[d.device]?.color ?? "#999" }}
                      />
                      {DEVICES[d.device]?.label ?? d.device}
                    </span>
                    <span className="tabular-nums text-white/60">
                      {Math.round((d.views / deviceTotal) * 100)}% · {formatInt(d.views)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function VisitsSkeleton() {
  return (
    <div className={cn(CARD, "animate-pulse p-6")} aria-hidden>
      <div className="h-5 w-32 rounded bg-white/10" />
      <div className="mt-3 h-3 w-64 rounded bg-white/5" />
      <div className="mt-8 h-64 rounded-xl bg-white/5" />
    </div>
  );
}