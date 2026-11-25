import type { ReactNode } from "react";

import { RiderShell } from "@/features/rider/RiderShell";
import { requireRole } from "@/lib/session";

export const metadata = {
  title: { default: "Rider | PRIC", template: "%s | PRIC Rider" },
  robots: { index: false, follow: false },
};

export default async function RiderLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("rider");
  return <RiderShell user={{ name: user.name }}>{children}</RiderShell>;
}