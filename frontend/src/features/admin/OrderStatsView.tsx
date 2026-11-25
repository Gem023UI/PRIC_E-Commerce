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

import { formatDuration, type OrderFilters, type OrderStats } from "@/lib/admin-orders";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { PAYMENT_STATUS_LABELS, STATUS_LABELS, type OrderStatus, type PaymentStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";

import { MetricFooter, Note, Tile, Value } from "./BusinessTiles";
import { CARD } from "./ui";

const GOLD = "#efc673";
const GREEN = "#34d399";
const RED = "#f87171";
const TICK = { fill: "rgba(255,255,255,0.55)", fontSize: 12 };

const STATUS_BAR: Record<OrderStatus, string> = {
  to_confirm: "bg-amber-300",
  to_ship: "bg-sky-300",
  on_delivery: "bg-[#efc673]",
  completed: "bg-emerald-300",
  cancelled: "bg-red-300",
};

const STATUS_ORDER: OrderStatus[] = ["to_confirm", "to_ship", "on_delivery", "completed", "cancelled"];
const PAYMENT_ORDER: PaymentStatus[] = ["unpaid", "pending_verification", "paid"];

function AttentionRow({
  label,
  count,
  hot,
  onClick,
}: {
  label: string;
  count: number;
  hot?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#efc673]"
      >
        <span className="text-white/80">{label}</span>
        <span
          className={cn(
            "min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums",
            count > 0 && hot ? "bg-orange-500/20 text-orange-300" : "bg-white/10 text-white/80",
          )}
        >
          {formatInt(count)}
        </span>
      </button>
    </li>
  );
}

export function OrderStatsView({
  data,
  compare,
  onFocus,
}: {
  data: OrderStats;
  compare: string;
  onFocus: (preset: Partial<OrderFilters>) => void;
}) {
  const { live } = data;
  const maxStatus = Math.max(1, ...Object.values(data.byStatus));
  const hasActivity = data.series.some((p) => p.placed || p.completed || p.cancelled);
  const chart = data.series.map((p) => ({
    label: p.label,
    placed: p.future ? null : p.placed,
    completed: p.future ? null : p.completed,
    cancelled: p.future ? null : p.cancelled,
  }));

  return (
    <>
      <Tile
        label="Orders placed"
        description="Orders received in the selected range, whatever their status"
        footer={<MetricFooter metric={data.placed} compare={compare} />}
      >
        <Value size="lg">{formatInt(data.placed.value)}</Value>
      </Tile>

      <Tile
        label="Cancellation rate"
        description="Share of orders placed in this range that were cancelled"
        footer={
          <Note>
            {formatInt(data.cancellation.cancelled)} cancelled · {data.cancellation.previous}% in the
            comparison period
          </Note>
        }
      >
        <Value size="lg" className={data.cancellation.rate >= 20 ? "text-red-400" : undefined}>
          {data.cancellation.rate}%
        </Value>
      </Tile>

      <Tile
        label="Average fulfilment time"
        description="Time from order placed to delivered, for orders completed in this range"
        footer={
          <Note>
            {data.fulfilment.completed > 0
              ? `${formatInt(data.fulfilment.completed)} delivered · before: ${formatDuration(data.fulfilment.previousHours)}`
              : "No deliveries completed in this range"}
          </Note>
        }
      >
        <Value size="lg">{formatDuration(data.fulfilment.avgHours)}</Value>
      </Tile>

      <Tile
        label="Needs attention"
        description="Live queues, regardless of the date range. Click one to filter the list."
      >
        <ul className="-mx-2">
          <AttentionRow
            label="Waiting for confirmation"
            count={live.toConfirm}
            hot
            onClick={() => onFocus({ status: "to_confirm" })}
          />
          <AttentionRow
            label="Payments to verify"
            count={live.paymentsToVerify}
            hot
            onClick={() => onFocus({ payment: "pending_verification" })}
          />
          <AttentionRow
            label="To ship, no rider yet"
            count={live.toShipUnassigned}
            hot
            onClick={() => onFocus({ status: "to_ship", rider: "unassigned" })}
          />
          <AttentionRow
            label="Out for delivery"
            count={live.onDelivery}
            onClick={() => onFocus({ status: "on_delivery" })}
          />
        </ul>
      </Tile>

      {/* Orders over time */}
      <article className={cn(CARD, "flex min-h-[20rem] flex-col p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Orders over time</h3>
        <p className="mt-1 text-sm text-white/60">Placed, delivered and cancelled.</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/70">
          {[
            ["Placed", GOLD],
            ["Delivered", GREEN],
            ["Cancelled", RED],
          ].map(([l, c]) => (
            <span key={l} className="inline-flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: c }} />
              {l}
            </span>
          ))}
        </div>
        <div className="mt-3 min-h-56 w-full min-w-0 flex-1">
          {!hasActivity ? (
            <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/55">
              No orders in this period yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={224}>
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="ordPlaced" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="placed" name="Placed" stroke={GOLD} strokeWidth={2} fill="url(#ordPlaced)" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                <Area type="monotone" dataKey="completed" name="Delivered" stroke={GREEN} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke={RED} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>

      <Tile label="Orders by status" description="Where this range's orders stand right now">
        <ul className="space-y-3">
          {STATUS_ORDER.map((s) => (
            <li key={s}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{STATUS_LABELS[s]}</span>
                <span className="font-semibold tabular-nums text-white">{formatInt(data.byStatus[s])}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full", STATUS_BAR[s])}
                  style={{ width: `${(data.byStatus[s] / maxStatus) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile label="Payments" description="Active orders placed in this range, by payment status">
        <ul className="space-y-3">
          {PAYMENT_ORDER.map((p) => (
            <li key={p} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-white/80">{PAYMENT_STATUS_LABELS[p]}</span>
              <span className="text-right">
                <span className="block font-semibold tabular-nums text-white">
                  {formatInt(data.payments[p].orders)}
                </span>
                <span className="block text-xs tabular-nums text-white/50">
                  {formatPeso(data.payments[p].amount)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Tile>
    </>
  );
}