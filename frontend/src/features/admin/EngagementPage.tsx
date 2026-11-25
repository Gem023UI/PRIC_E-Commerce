"use client";

import * as React from "react";

import type { ApplicationStatus, EngagementStats, Tab } from "@/lib/admin-engagement";
import { COMPARE_LABELS, RANGE_LABELS, formatRangeSpan, type RangeKey } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { AnnouncementsPanel } from "./AnnouncementsPanel";
import { ApplicationsPanel } from "./ApplicationsPanel";
import { TileSkeleton } from "./BusinessTiles";
import { EngagementStatsView } from "./EngagementStatsView";
import { EventsPanel } from "./EventsPanel";
import { InquiriesPanel } from "./InquiriesPanel";
import { RangeToolbar } from "./RangeToolbar";
import { SeminarsPanel } from "./SeminarsPanel";
import { ErrorBanner } from "./ui";
import { useAdminStat, useRangeState } from "./use-admin-stat";

const TABS: { key: Tab; label: string }[] = [
  { key: "inquiries", label: "Inquiries" },
  { key: "membership", label: "Membership" },
  { key: "events", label: "Events" },
  { key: "announcements", label: "Announcements" },
];

const SKELETON = ["", "", "", "", "md:col-span-2 min-h-[20rem]", "md:col-span-2 min-h-[20rem]"];

export function EngagementPage({ initialRange, initialTab }: { initialRange: RangeKey; initialTab: Tab }) {
  const [range, setRange] = useRangeState(initialRange);
  const { data, error, loading, updatedAt, refresh } = useAdminStat<EngagementStats>(
    "/api/admin/engagement/stats",
    range,
  );

  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [seminarFilter, setSeminarFilter] = React.useState("");
  const [appStatus, setAppStatus] = React.useState<"all" | ApplicationStatus>("all");
  const tabsRef = React.useRef<HTMLDivElement>(null);

  const go = React.useCallback((next: Tab, status?: "new") => {
    setTab(next);
    if (next === "membership") {
      setSeminarFilter("");
      setAppStatus(status ?? "all");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const stale = loading && data?.range.key !== range;
  const compare = COMPARE_LABELS[range];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Cooperative engagement</h1>
          <p className="mt-1.5 text-sm text-white/60">
            {data && data.range.key === range
              ? `${RANGE_LABELS[range]} · ${formatRangeSpan(data.range)} (Philippine time)`
              : RANGE_LABELS[range]}
          </p>
        </div>
        <RangeToolbar range={range} onChange={setRange} loading={loading} updatedAt={updatedAt} onRefresh={refresh} />
      </header>

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      <div
        aria-busy={stale}
        className={cn("grid gap-4 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-4", stale && "opacity-60")}
      >
        {data ? (
          <EngagementStatsView data={data} compare={compare} onGo={go} />
        ) : (
          SKELETON.map((cls, i) => <TileSkeleton key={i} className={cls} />)
        )}
      </div>

      <div ref={tabsRef} className="scroll-mt-6">
        <div role="tablist" aria-label="Engagement sections" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => go(t.key)}
              className={cn(
                "shrink-0 rounded-full border px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]",
                tab === t.key
                  ? "border-[#efc673]/60 bg-[#efc673]/15 font-semibold text-[#f4d587]"
                  : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-4 space-y-6">
          {tab === "inquiries" && <InquiriesPanel onChanged={refresh} />}
          {tab === "membership" && (
            <>
              <SeminarsPanel onViewApplicants={setSeminarFilter} onChanged={refresh} />
              <ApplicationsPanel
                key={appStatus}
                seminar={seminarFilter}
                onClearSeminar={() => setSeminarFilter("")}
                initialStatus={appStatus}
                onChanged={refresh}
              />
            </>
          )}
          {tab === "events" && <EventsPanel onChanged={refresh} />}
          {tab === "announcements" && <AnnouncementsPanel onChanged={refresh} />}
        </div>
      </div>
    </div>
  );
}

export default EngagementPage;