"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { logout } from "@/components/layout/account-menu";
import { anton, poppins } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import {
  ChartIcon,
  ClipboardIcon,
  CloseIcon,
  CubeIcon,
  GlobeIcon,
  GridIcon,
  LogoutIcon,
  MegaphoneIcon,
  MenuIcon,
  UsersIcon,
} from "./icons";

/** Flip `ready` to true as each page is built; unfinished pages show a "Soon" tag. */
const NAV = [
  { label: "Overview", href: "/admin", icon: GridIcon, ready: true },
  { label: "Business performance", href: "/admin/business", icon: ChartIcon, ready: true },
  { label: "Customers", href: "/admin/customers", icon: UsersIcon, ready: true },
  { label: "Orders", href: "/admin/orders", icon: ClipboardIcon, ready: true },
  { label: "Products & inventory", href: "/admin/products", icon: CubeIcon, ready: true },
  { label: "Cooperative engagement", href: "/admin/engagement", icon: MegaphoneIcon, ready: false },
];

const ROW =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]";

function SidebarContent({
  user,
  pathname,
  onNavigate,
}: {
  user: { name: string; email: string };
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 pb-5 pt-7">
        <Link href="/admin" onClick={onNavigate} aria-label="PRIC admin home" className="inline-block">
          <MetallicGoldText
            as="span"
            fold={false}
            className={cn(anton.className, "select-none")}
            style={{ fontSize: "1.9rem", lineHeight: 1.1, letterSpacing: "0.05em" }}
          >
            PRIC
          </MetallicGoldText>
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-white/45">Admin</p>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-1">
          {NAV.map(({ label, href, icon: Icon, ready }) => {
            const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
            if (!ready) {
              return (
                <li key={href}>
                  <span
                    aria-disabled="true"
                    className={cn(ROW, "cursor-not-allowed text-white/40")}
                  >
                    <Icon className="size-[18px] shrink-0" />
                    <span className="flex-1 truncate">{label}</span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                      Soon
                    </span>
                  </span>
                </li>
              );
            }
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    ROW,
                    active
                      ? "bg-white/10 font-semibold text-white"
                      : "text-white/75 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Icon className={cn("size-[18px] shrink-0", active && "text-[#efc673]")} />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-1 border-t border-white/10 p-4">
        <div className="px-3 pb-2">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-white/55">{user.email}</p>
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(ROW, "text-white/75 hover:bg-white/5 hover:text-white")}
        >
          <GlobeIcon className="size-[18px]" />
          View site
        </Link>
        <button
          type="button"
          onClick={logout}
          className={cn(ROW, "text-white/75 hover:bg-white/5 hover:text-white")}
        >
          <LogoutIcon className="size-[18px]" />
          Log out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close the mobile drawer after navigating.
  React.useEffect(() => setOpen(false), [pathname]);

  // Drawer: Escape closes, page scroll is locked.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={cn(poppins.className, "relative z-10 min-h-svh bg-[#050505] text-white")}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-black lg:block">
        <SidebarContent user={user} pathname={pathname} />
      </aside>

      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex size-10 items-center justify-center rounded-full border border-white/15 text-white/90"
          >
            <MenuIcon />
          </button>
          <MetallicGoldText
            as="span"
            fold={false}
            className={cn(anton.className, "select-none")}
            style={{ fontSize: "1.5rem", lineHeight: 1.1, letterSpacing: "0.05em" }}
          >
            PRIC
          </MetallicGoldText>
          <span className="w-10" aria-hidden />
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-black shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-white/15 text-white/80"
            >
              <CloseIcon className="size-4" />
            </button>
            <SidebarContent user={user} pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShell;