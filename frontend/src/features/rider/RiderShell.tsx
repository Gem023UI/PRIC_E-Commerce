"use client";

import Link from "next/link";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { logout } from "@/components/layout/account-menu";
import { anton, poppins } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { LogoutIcon } from "../admin/icons";

export function RiderShell({
  user,
  children,
}: {
  user: { name: string };
  children: React.ReactNode;
}) {
  return (
    <div className={cn(poppins.className, "relative z-10 min-h-svh bg-[#050505] text-white")}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/rider/orders" className="flex items-baseline gap-2" aria-label="My deliveries">
            <MetallicGoldText
              as="span"
              fold={false}
              className={cn(anton.className, "select-none")}
              style={{ fontSize: "1.6rem", lineHeight: 1.1, letterSpacing: "0.05em" }}
            >
              PRIC
            </MetallicGoldText>
            <span className="text-[11px] uppercase tracking-[0.25em] text-white/45">Rider</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[10rem] truncate text-sm text-white/70 sm:block">{user.name}</span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-2 text-sm text-white/85 transition-colors hover:border-white/30 hover:text-white"
            >
              <LogoutIcon className="size-4" />
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}

export default RiderShell;