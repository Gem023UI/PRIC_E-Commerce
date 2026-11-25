"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { CloseIcon } from "./icons";

export const INPUT =
  "w-full min-h-11 rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60 [color-scheme:dark]";

export const inputClass = (error?: string) => cn(INPUT, error ? "border-red-400" : "border-white/15");

export function FormField({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-white">
        {label}
        {optional && <span className="text-white/50"> (optional)</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-white/50">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function ModalShell({
  title,
  subtitle,
  wide,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = React.useId();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:items-center">
      <div className="fixed inset-0 bg-black/75" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative my-6 w-full rounded-2xl border border-[#c8933a]/40 bg-[#0a0a0a] p-6 shadow-2xl md:p-8",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-semibold text-[#f4d587]">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-white/60">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

/** Cancel + submit row shared by the forms. */
export function FormActions({
  busy,
  submitLabel,
  busyLabel = "Saving…",
  onCancel,
  gold,
}: {
  busy: boolean;
  submitLabel: string;
  busyLabel?: string;
  onCancel: () => void;
  gold: string;
}) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-11 rounded-xl border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-[#efc673]"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="min-h-11 rounded-xl px-6 text-sm font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
        style={{ backgroundImage: gold }}
      >
        {busy ? busyLabel : submitLabel}
      </button>
    </div>
  );
}