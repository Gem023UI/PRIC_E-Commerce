"use client";

import * as React from "react";
import Link from "next/link";

import { clearSessionCache, useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const GLASS =
  "border border-white/15 bg-black/35 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

const ICON_BTN =
  "flex h-10 w-10 items-center justify-center rounded-full text-white transition duration-200 hover:scale-110 hover:bg-white/10";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-5 w-5",
} as const;

const PersonIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const CartIcon = () => (
  <svg {...iconProps}>
    <circle cx="9" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
    <path d="M2 3h3l2.7 12.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6" />
  </svg>
);

async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearSessionCache();
    window.location.assign("/");
  }
}

export function DesktopAuthActions() {
  const { loading, user } = useSession();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) {
    return <div aria-hidden className="hidden h-10 w-24 justify-self-end md:block" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="hidden justify-self-end rounded-full px-5 py-2 text-sm font-semibold text-[#2a1802] shadow-lg transition duration-200 hover:scale-110 hover:brightness-110 md:block"
        style={{ backgroundImage: GOLD_GRADIENT }}
      >
        SIGN IN
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className="relative hidden items-center gap-1 justify-self-end md:flex"
    >
      <Link href="/cart" aria-label="Cart" className={ICON_BTN}>
        <CartIcon />
      </Link>
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={ICON_BTN}
      >
        <PersonIcon />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full mt-2 w-60 rounded-2xl p-3",
            GLASS,
          )}
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-white/60">{user.email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="mt-1 block w-full rounded-xl px-3 py-2 text-left text-sm text-white/90 transition-colors hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileAuthActions({ onNavigate }: { onNavigate: () => void }) {
  const { loading, user } = useSession();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className="mt-2 block rounded-full px-5 py-2.5 text-center text-sm font-semibold text-[#2a1802] transition hover:scale-105 hover:brightness-110"
        style={{ backgroundImage: GOLD_GRADIENT }}
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="mt-2 border-t border-white/10 pt-2">
      <p className="truncate px-4 py-1 text-xs text-white/60">{user.name}</p>
      <div className="flex items-center gap-1 px-2">
        <Link
          href="/cart"
          aria-label="Cart"
          onClick={onNavigate}
          className={ICON_BTN}
        >
          <CartIcon />
        </Link>
        <span aria-label={`Signed in as ${user.name}`} className={ICON_BTN}>
          <PersonIcon />
        </span>
        <button
          type="button"
          onClick={logout}
          className="ml-auto rounded-full px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </div>
  );
}