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

import type { CustomerStats } from "@/lib/admin-customers";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { MetricFooter, Note, Tile, Value } from "./BusinessTiles";
import { TypeBadge } from "./Badges";
import { CARD, ChangePill } from "./ui";

const BLUE = "#7dd3fc";
const GOLD = "#efc673";
const TICK = { fill: "rgba(255,255,255,0.55)", fontSize: 12 };

const Row = ({ label, value }: { label: string; value: string }) => (
  <li className="flex items-center justify-between gap-4 text-sm">
    <span className="text-white/75">{label}</span>
    <span className="font-semibold tabular-nums text-white">{value}</span>
  </li>
);

export function CustomerStatsView({
  data,
  compare,
  onOpen,
}: {
  data: CustomerStats;
  compare: string;
  onOpen: (email: string) => void;
}) {
  const c = data.customers;
  const newShare = c.buyers.value ? (c.newBuyers / c.buyers.value) * 100 : 0;
  const hasActivity = data.series.some((p) => p.registrations > 0 || p.buyers > 0);

  const chart = data.series.map((p) => ({
    label: p.label,
    registrations: p.future ? null : p.registrations,
    buyers: p.future ? null : p.buyers,
  }));

  return (
    <>
      <Tile
        label="Registered customers"
        description="Customer accounts that can sign in or are waiting for their invitation"
        footer={
          <div className="space-y-1.5">
            <Note>
              {c.newAccounts.value > 0
                ? `+${formatInt(c.newAccounts.value)} new in this range`
                : "No new accounts in this range"}
            </Note>
            <ChangePill change={c.newAccounts.change} label={compare} />
          </div>
        }
      >
        <Value size="lg">{formatInt(c.total)}</Value>
      </Tile>

      <Tile
        label="Active buyers"
        description="Customers (accounts and guests) who placed an order in this range"
        footer={<MetricFooter metric={c.buyers} compare={compare} />}
      >
        <Value size="lg">{formatInt(c.buyers.value)}</Value>
      </Tile>

      <Tile
        label="New vs returning"
        description="Buyers in this range by whether it was their first order"
        footer={
          <div>
            <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-[#efc673]" style={{ width: `${newShare}%` }} />
              <div className="h-full bg-[#7dd3fc]" style={{ width: `${c.buyers.value ? 100 - newShare : 0}%` }} />
            </div>
            <p className="mt-2 flex justify-between text-xs text-white/55">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#efc673]" /> New
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#7dd3fc]" /> Returning
              </span>
            </p>
          </div>
        }
      >
        <div className="flex items-baseline gap-5">
          <div>
            <Value size="lg" className="text-[#f4d587]">
              {formatInt(c.newBuyers)}
            </Value>
            <p className="text-xs text-white/55">new</p>
          </div>
          <div>
            <Value size="lg" className="text-sky-300">
              {formatInt(c.returningBuyers)}
            </Value>
            <p className="text-xs text-white/55">returning</p>
          </div>
        </div>
      </Tile>

      <Tile
        label="Repeat purchase rate"
        description="Share of all customers who have ordered more than once"
        footer={
          <Note>
            {formatInt(c.repeatRate.repeaters)} of {formatInt(c.repeatRate.buyers)} customers who
            have ordered (all time)
          </Note>
        }
      >
        <Value size="lg">{c.repeatRate.value}%</Value>
      </Tile>

      {/* Registrations vs buyers */}
      <article className={cn(CARD, "flex min-h-[20rem] flex-col p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Registrations and buyers</h3>
        <p className="mt-1 text-sm text-white/60">New accounts created and customers who ordered.</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/70">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: BLUE }} />
            New accounts
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: GOLD }} />
            Buyers
          </span>
        </div>
        <div className="mt-3 min-h-56 w-full min-w-0 flex-1">
          {!hasActivity ? (
            <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/55">
              No new accounts or orders in this period yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={224}>
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="custBuyers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={TICK} tickLine={false} axisLine={false} width={36} />
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
                  dataKey="buyers"
                  name="Buyers"
                  stroke={GOLD}
                  strokeWidth={2}
                  fill="url(#custBuyers)"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="registrations"
                  name="New accounts"
                  stroke={BLUE}
                  strokeWidth={2}
                  fill="none"
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>

      {/* Top customers */}
      <article className={cn(CARD, "p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Top customers</h3>
        <p className="mt-1 text-sm text-white/60">By completed sales in this range.</p>
        {data.topCustomers.length === 0 ? (
          <p className="mt-6 text-sm text-white/55">No completed sales in this period yet.</p>
        ) : (
          <ol className="mt-4 divide-y divide-white/10">
            {data.topCustomers.map((t, i) => (
              <li key={t.email}>
                <button
                  type="button"
                  onClick={() => onOpen(t.email)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#efc673]"
                >
                  <span className="w-5 shrink-0 text-xs tabular-nums text-white/40">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{t.name}</span>
                      <TypeBadge type={t.type} />
                    </span>
                    <span className="block truncate text-xs text-white/50">{t.email}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-white">
                      {formatPeso(t.spent)}
                    </span>
                    <span className="block text-xs text-white/50">
                      {formatInt(t.orders)} {t.orders === 1 ? "order" : "orders"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </article>

      <Tile
        label="Account status"
        description="Active accounts have set a password; invited ones are still waiting to"
      >
        <ul className="space-y-2.5">
          <Row label="Active" value={formatInt(c.accountStates.active)} />
          <Row label="Invited" value={formatInt(c.accountStates.invited)} />
          <Row label="Deactivated" value={formatInt(c.accountStates.deactivated)} />
        </ul>
      </Tile>

      <Tile label="Accounts vs guests" description="Customers who have ordered, by how they check out">
        <ul className="space-y-2.5">
          <Row label="With an account" value={formatInt(c.buyerTypes.accounts)} />
          <Row label="Guests" value={formatInt(c.buyerTypes.guests)} />
        </ul>
      </Tile>

      <Tile label="Orders per customer" description="Average orders (cancelled excluded) per customer who has ordered">
        <Value size="lg">{c.ordersPerBuyer.toFixed(2)}</Value>
      </Tile>

      <Tile
        label="Average lifetime spend"
        description="Average completed-order spend per customer who has completed an order"
      >
        <Value size="lg">{formatPeso(c.spendPerCustomer)}</Value>
      </Tile>
    </>
  );
}