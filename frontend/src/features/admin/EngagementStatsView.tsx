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

import type { EngagementStats, Tab } from "@/lib/admin-engagement";
import { formatInt } from "@/lib/admin-stats";
import { formatShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { MetricFooter, Note, Tile, Value } from "./BusinessTiles";
import { CARD } from "./ui";

const GOLD = "#efc673";
const BLUE = "#7dd3fc";
const TICK = { fill: "rgba(255,255,255,0.55)", fontSize: 12 };

function AttentionRow({
  label,
  count,
  hot,
  onClick,
}: {
  label: string;
  count?: number;
  hot?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#efc673]"
      >
        <span className="text-white/80">{label}</span>
        {count !== undefined && (
          <span
            className={cn(
              "min-w-7 rounded-full px-2 py-0.5 text-center text-xs font-bold tabular-nums",
              count > 0 && hot ? "bg-orange-500/20 text-orange-300" : "bg-white/10 text-white/80",
            )}
          >
            {formatInt(count)}
          </span>
        )}
      </button>
    </li>
  );
}

export function EngagementStatsView({
  data,
  compare,
  onGo,
}: {
  data: EngagementStats;
  compare: string;
  onGo: (tab: Tab, applicationStatus?: "new") => void;
}) {
  const a = data.attention;
  const hasActivity = data.series.some((p) => p.inquiries > 0 || p.applications > 0);
  const chart = data.series.map((p) => ({
    label: p.label,
    inquiries: p.future ? null : p.inquiries,
    applications: p.future ? null : p.applications,
  }));

  return (
    <>
      <Tile
        label="Open inquiries"
        description="Inquiries that are new or being followed up"
        footer={<MetricFooter metric={data.inquiries.received} compare={compare} />}
      >
        <Value size="lg" className={data.inquiries.open > 0 ? "text-orange-300" : undefined}>
          {formatInt(data.inquiries.open)}
        </Value>
        <p className="mt-1 text-xs text-white/55">{formatInt(data.inquiries.received.value)} received in this range</p>
      </Tile>

      <Tile
        label="Membership applications"
        description="Applications received in this range"
        footer={<MetricFooter metric={data.applications.received} compare={compare} />}
      >
        <Value size="lg">{formatInt(data.applications.received.value)}</Value>
        <p className="mt-1 text-xs text-white/55">{formatInt(data.applications.pending)} awaiting a decision</p>
      </Tile>

      <Tile
        label="Next PMES seminar"
        description="The earliest open seminar on the schedule"
        footer={
          data.nextSeminar ? (
            <Note>
              {[data.nextSeminar.startTime, data.nextSeminar.venue].filter(Boolean).join(" · ") || "No venue set"}
            </Note>
          ) : (
            <button
              type="button"
              onClick={() => onGo("membership")}
              className="text-xs font-semibold text-[#f4d587] underline-offset-4 hover:underline"
            >
              Schedule a seminar
            </button>
          )
        }
      >
        {data.nextSeminar ? (
          <>
            <Value size="md">{formatShortDate(data.nextSeminar.date)}</Value>
            <p className="mt-1 text-xs text-white/55">
              {formatInt(data.nextSeminar.applicants)} {data.nextSeminar.applicants === 1 ? "applicant" : "applicants"}
            </p>
          </>
        ) : (
          <Value size="md" className="text-white/50">
            None scheduled
          </Value>
        )}
      </Tile>

      <Tile
        label="Content"
        description="What visitors can see on the site right now"
      >
        <ul className="space-y-2.5 text-sm">
          <li className="flex justify-between">
            <span className="text-white/75">Upcoming events</span>
            <span className="font-semibold tabular-nums">{formatInt(data.events.upcoming)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-white/75">Past events</span>
            <span className="font-semibold tabular-nums">{formatInt(data.events.past)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-white/75">Active announcements</span>
            <span className="font-semibold tabular-nums">{formatInt(data.announcements.active)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-white/75">Scheduled announcements</span>
            <span className="font-semibold tabular-nums">{formatInt(data.announcements.scheduled)}</span>
          </li>
        </ul>
      </Tile>

      <article className={cn(CARD, "flex min-h-[20rem] flex-col p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Inquiries and applications</h3>
        <p className="mt-1 text-sm text-white/60">Received over time.</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/70">
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: GOLD }} />
            Inquiries
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ background: BLUE }} />
            Applications
          </span>
        </div>
        <div className="mt-3 min-h-56 w-full min-w-0 flex-1">
          {!hasActivity ? (
            <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/55">
              Nothing received in this period yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minHeight={224}>
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="engInq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
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
                <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke={GOLD} strokeWidth={2} fill="url(#engInq)" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                <Area type="monotone" dataKey="applications" name="Applications" stroke={BLUE} strokeWidth={2} fill="none" dot={false} activeDot={{ r: 4 }} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </article>

      <article className={cn(CARD, "p-5 md:col-span-2 md:p-6")}>
        <h3 className="text-lg font-semibold text-white">Needs attention</h3>
        <p className="mt-1 text-sm text-white/60">Live, regardless of the date range. Click to jump there.</p>
        <ul className="-mx-2 mt-3">
          <AttentionRow label="New inquiries to answer" count={a.newInquiries} hot onClick={() => onGo("inquiries")} />
          <AttentionRow label="New membership applications" count={a.newApplications} hot onClick={() => onGo("membership", "new")} />
          {a.noSeminar && <AttentionRow label="No PMES seminar is scheduled. Add the next Saturday." onClick={() => onGo("membership")} />}
          {a.noAnnouncement && <AttentionRow label="No announcement is active on the site." onClick={() => onGo("announcements")} />}
          {!a.noSeminar && !a.noAnnouncement && a.newInquiries === 0 && a.newApplications === 0 && (
            <li className="px-2 py-2.5 text-sm text-white/55">Everything is up to date.</li>
          )}
        </ul>
      </article>
    </>
  );
}