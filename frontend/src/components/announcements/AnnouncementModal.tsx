"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { formatSpan } from "@/lib/dates";
import { anton, poppins } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Announcement = {
  id: string;
  version: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
};

const SEEN_KEY = "pric-announcements-seen";

function readSeen(): string[] {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Opens once per browser session when there is an active announcement the visitor hasn't seen. */
export default function AnnouncementModal() {
  const [items, setItems] = React.useState<Announcement[]>([]);
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    let timer: number | undefined;

    (async () => {
      try {
        const res = await fetch("/api/announcements/active", { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { announcements: Announcement[] };
        const seen = new Set(readSeen());
        if (data.announcements.length > 0 && data.announcements.some((a) => !seen.has(a.version))) {
          setItems(data.announcements);
          timer = window.setTimeout(() => setOpen(true), 700); // let the page settle first
        }
      } catch {
        /* aborted or offline: no announcement */
      }
    })();

    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    try {
      window.sessionStorage.setItem(
        SEEN_KEY,
        JSON.stringify([...new Set([...readSeen(), ...items.map((a) => a.version)])]),
      );
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, items.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, close, items.length]);

  const a = items[index];
  if (!open || !a) return null;

  return createPortal(
    <div
      className={cn(
        poppins.className,
        "fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 text-white",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-[#c8933a]/50 bg-[#0a0a0a] shadow-2xl"
      >
        {a.image && (
          <div className="aspect-[16/9] w-full bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.image} alt="" className="size-full object-cover" />
          </div>
        )}

        <div className="p-6 md:p-8">
          <p className="inline-block rounded-full bg-[#efc673]/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#f4d587]">
            {formatSpan(a.startDate, a.endDate)}
          </p>
          <h2 id="announcement-title" className={cn(anton.className, "mt-3 text-3xl leading-tight text-[#f4d587]")}>
            {a.title}
          </h2>
          {a.description && (
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-white/85">{a.description}</p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            {items.length > 1 ? (
              <div className="flex items-center gap-3 text-sm text-white/70">
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                  disabled={index === 0}
                  aria-label="Previous announcement"
                  className="flex size-9 items-center justify-center rounded-full border border-white/25 disabled:opacity-30"
                >
                  ←
                </button>
                <span aria-live="polite">
                  {index + 1} of {items.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(i + 1, items.length - 1))}
                  disabled={index === items.length - 1}
                  aria-label="Next announcement"
                  className="flex size-9 items-center justify-center rounded-full border border-white/25 disabled:opacity-30"
                >
                  →
                </button>
              </div>
            ) : (
              <span />
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="rounded-full px-7 py-2.5 text-sm font-bold text-[#2a1802] transition-transform hover:scale-105"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}