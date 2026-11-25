"use client";

import * as React from "react";

import type { RangeKey } from "@/lib/admin-stats";

/** Selected date range, kept in the URL (?range=) without a navigation. */
export function useRangeState(initial: RangeKey) {
  const [range, setRange] = React.useState<RangeKey>(initial);

  const change = React.useCallback((next: RangeKey) => {
    setRange(next);
    const url = new URL(window.location.href);
    url.searchParams.set("range", next);
    window.history.replaceState(null, "", url);
  }, []);

  return [range, change] as const;
}

/**
 * Loads an admin stats endpoint for a range. Keeps the previous data on screen while a new
 * range loads, refreshes quietly every `pollMs` while the tab is visible.
 */
export function useAdminStat<T>(endpoint: string, range: RangeKey, pollMs = 60_000) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updatedAt, setUpdatedAt] = React.useState<Date | null>(null);
  const [tick, setTick] = React.useState(0);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`${endpoint}?range=${range}`, {
          cache: "no-store",
          signal: ctrl.signal,
        });
        if (res.status === 401 || res.status === 403) {
          window.location.assign("/login");
          return;
        }
        if (!res.ok) throw new Error(String(res.status));
        setData((await res.json()) as T);
        setUpdatedAt(new Date());
        setError(null);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("We couldn't load the latest numbers.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [endpoint, range, tick]);

  React.useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  return { data, error, loading, updatedAt, refresh };
}