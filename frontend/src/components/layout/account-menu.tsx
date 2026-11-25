"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";

import { clearSessionCache, useSession } from "@/hooks/use-session";
import { homeForRole, homeLabelForRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

const GLASS =
  "border border-white/15 bg-transparent/35 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

const ITEM =
  "flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm text-white/90 transition-colors hover:bg-white/10";

async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    clearSessionCache();
    try {
      window.localStorage.removeItem("pric-user");
    } catch {
      /* storage unavailable */
    }
    window.location.assign("/");
  }
}

/** Desktop header icon: a login link when signed out, an account menu when signed in. */
export function AccountMenu({ buttonClassName }: { buttonClassName: string }) {
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

  if (loading) return <div aria-hidden className="hidden h-9 w-9 md:block" />;

  if (!user) {
    return (
      <div className="hidden md:block">
        <Link href="/login" aria-label="Log in" className={cn("flex", buttonClassName)}>
          <HugeiconsIcon icon={UserIcon} size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex", buttonClassName)}
      >
        <HugeiconsIcon icon={UserIcon} size={18} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn("absolute right-0 top-full mt-2 w-60 rounded-2xl p-3", GLASS)}
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-white/60">{user.email}</p>
          </div>
          <Link
            href={homeForRole(user.role)}
            role="menuitem"
            onClick={() => setOpen(false)}
            className={ITEM}
          >
            {homeLabelForRole(user.role)}
          </Link>
          <button type="button" role="menuitem" onClick={logout} className={ITEM}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

/** The same links as list items for the mobile dropdown. */
export function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { loading, user } = useSession();
  if (loading) return null;

  if (!user) {
    return (
      <li>
        <Link href="/login" onClick={onNavigate} className={ITEM}>
          <HugeiconsIcon icon={UserIcon} size={16} />
          Log in
        </Link>
      </li>
    );
  }

  return (
    <>
      <li>
        <Link href={homeForRole(user.role)} onClick={onNavigate} className={ITEM}>
          <HugeiconsIcon icon={UserIcon} size={16} />
          {homeLabelForRole(user.role)}
        </Link>
      </li>
      <li>
        <button type="button" onClick={logout} className={ITEM}>
          Log out
        </button>
      </li>
    </>
  );
}