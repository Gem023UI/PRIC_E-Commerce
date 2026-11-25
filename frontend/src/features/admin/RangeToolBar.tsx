"use client";

import type { RangeKey } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { DateRangeFilter } from "./DateRangeFilter";
import { RefreshIcon } from "./icons";

const time = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  hour: "numeric",
  minute: "2-digit",
});

export function RangeToolbar({
  range,
  onChange,
  loading,
  updatedAt,
  onRefresh,
}: {
  range: RangeKey;
  onChange: (key: RangeKey) => void;
  loading: boolean;
  updatedAt: Date | null;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <DateRangeFilter value={range} onChange={onChange} />
      <div className="flex items-center gap-3 text-xs text-white/50">
        {updatedAt && <span>Updated {time.format(updatedAt)}</span>}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refresh numbers"
          className="inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:border-white/30 hover:text-white disabled:opacity-60"
        >
          <RefreshIcon className={cn("size-4", loading && "animate-spin")} />
        </button>
      </div>
    </div>
  );
}