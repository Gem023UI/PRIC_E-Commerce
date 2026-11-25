import type { ReactNode } from "react";

import { requireRole } from "@/lib/session";

export default async function RiderLayout({ children }: { children: ReactNode }) {
  await requireRole("rider");
  return <>{children}</>;
}