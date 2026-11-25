import type { ReactNode } from "react";

import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole("admin");
  return <>{children}</>;
}