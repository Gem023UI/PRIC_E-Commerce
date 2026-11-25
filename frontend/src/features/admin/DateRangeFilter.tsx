"use client";

import { RANGE_KEYS, RANGE_LABELS, type RangeKey } from "@/lib/admin-stats";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (key: RangeKey) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {RANGE_KEYS.map((key) => {
        const on = key === value;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(key)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]",
              on
                ? "border-transparent text-[#2a1802]"
                : "border-white/15 bg-white/5 text-white/75 hover:border-white/30 hover:text-white",
            )}
            style={on ? { backgroundImage: GOLD_GRADIENT } : undefined}
          >
            {RANGE_LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}