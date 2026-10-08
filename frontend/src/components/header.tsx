"use client";

import * as React from "react";
import Link from "next/link";
import { Anton, Poppins } from "next/font/google";

import { MetallicGoldText } from "@/components/metallic-gold-text";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Products", href: "#products" },
  { label: "Events", href: "#events" },
  { label: "Contact Us", href: "#contact" },
];

const GLASS =
  "border border-white/15 bg-black/35 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]";

/** Nav link whose label turns metallic gold while hovered / focused. */
function NavLink({
  href,
  label,
  className,
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const [active, setActive] = React.useState(false);

  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={className}
    >
      {active ? (
        <MetallicGoldText style={{ WebkitTextStroke: "0", filter: "none" }}>
          {label}
        </MetallicGoldText>
      ) : (
        label
      )}
    </a>
  );
}

export function Header() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(poppins.className, "fixed inset-x-0 top-0 z-50 text-white")}
    >
      <Reveal
        y={-16}
        className="relative mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center px-5 py-3 md:grid-cols-[1fr_auto_1fr]"
      >
        {/* Logo */}
        <a href="#home" aria-label="PRIC home" className="justify-self-start">
          <MetallicGoldText
            as="span"
            className={cn(anton.className, "select-none")}
            style={{ fontSize: "1.65rem", lineHeight: 1.1, letterSpacing: "0.05em" }}
          >
            PRIC
          </MetallicGoldText>
        </a>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className={cn("hidden rounded-full px-2 py-1.5 md:block", GLASS)}
        >
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <NavLink
                  href={l.href}
                  label={l.label}
                  className="block rounded-full px-4 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop sign in */}
        <Link
          href="/login"
          className="hidden justify-self-end rounded-full px-5 py-2 text-sm font-semibold text-[#2a1802] shadow-lg transition duration-200 hover:scale-110 hover:brightness-110 md:block"
          style={{ backgroundImage: GOLD_GRADIENT }}
        >
          SIGN IN
        </Link>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex h-9 w-9 items-center justify-center justify-self-end rounded-full md:hidden",
            GLASS,
          )}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>

        {/* Mobile dropdown */}
        {open && (
          <div
            id="mobile-menu"
            className={cn(
              "absolute right-6 top-full w-64 rounded-2xl p-3 md:hidden",
              GLASS,
            )}
          >
            <ul className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <NavLink
                    href={l.href}
                    label={l.label}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-4 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
                  />
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-full px-5 py-2.5 text-center text-sm font-semibold text-[#2a1802] transition hover:scale-105 hover:brightness-110"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              Sign In
            </Link>
          </div>
        )}
      </Reveal>
    </header>
  );
}

export default Header;