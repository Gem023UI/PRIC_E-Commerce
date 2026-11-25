"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

// Private or per-order areas are never counted (the server also enforces this).
const SKIP = ["/admin", "/rider", "/set-password", "/orders/track"];

/** Reports each public page view once. No IP, no personal data; the server keeps an anonymous visitor cookie. */
export function VisitTracker() {
  const pathname = usePathname();
  const last = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!pathname || last.current === pathname) return;
    if (SKIP.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return;
    last.current = pathname;

    // keepalive so the request survives fast navigations; failures are ignored.
    void fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}