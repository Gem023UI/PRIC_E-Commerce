import type { ReactNode } from "react";

import { AdminShell } from "@/features/admin/AdminShell";
import { requireRole } from "@/lib/session";

export const metadata = {
  title: { default: "Admin | PRIC", template: "%s | PRIC Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("admin");
  return <AdminShell user={{ name: user.name, email: user.email }}>{children}</AdminShell>;
}