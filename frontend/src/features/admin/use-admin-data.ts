"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";

/** Loads an admin list endpoint; call `reload()` after a change. */
export function useAdminData<T extends object>(path: string) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await adminApi<T>(path, { signal: ctrl.signal });
        if (r.ok) {
          setData(r.data as T);
          setError(null);
        } else {
          setError("We couldn't load this list.");
        }
      } catch {
        /* aborted */
      }
    })();
    return () => ctrl.abort();
  }, [path, tick]);

  const reload = React.useCallback(() => setTick((t) => t + 1), []);
  return { data, error, reload };
}