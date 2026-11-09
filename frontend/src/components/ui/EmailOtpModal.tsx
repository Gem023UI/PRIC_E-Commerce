"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const LENGTH = 6;
const RESEND_SECONDS = 30;
const EMPTY = Array<string>(LENGTH).fill("");

type Props = {
  email: string;
  onClose: () => void;
  /** Resolves to an error message, or null when the code was accepted. */
  onVerify: (code: string) => Promise<string | null>;
  /** Resolves to an error message, or null when a new code was sent. */
  onResend: () => Promise<string | null>;
};

export default function EmailOtpModal({ email, onClose, onVerify, onResend }: Props) {
  const titleId = React.useId();
  const cardRef = React.useRef<HTMLDivElement>(null);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const [digits, setDigits] = React.useState<string[]>(EMPTY);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [shown, setShown] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(RESEND_SECONDS);

  // Fade in slightly after the form has faded out.
  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setShown(true);
      refs.current[0]?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Capture phase so Escape closes only this modal, not the inquiry dialog behind it.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !cardRef.current) return;
      const els = [
        ...cardRef.current.querySelectorAll<HTMLElement>("button:not([disabled]),input"),
      ];
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        e.stopPropagation();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        e.stopPropagation();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const fill = (start: number, raw: string) => {
    const chars = raw.replace(/\D/g, "").slice(0, LENGTH - start).split("");
    if (chars.length === 0) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, k) => {
        next[start + k] = c;
      });
      return next;
    });
    refs.current[Math.min(start + chars.length, LENGTH - 1)]?.focus();
  };

  const onInputChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const v = e.target.value;
    if (!v) {
      setDigits((prev) => prev.map((d, k) => (k === i ? "" : d)));
      return;
    }
    fill(i, v);
  };

  const onKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      setDigits((prev) => prev.map((d, k) => (k === i - 1 ? "" : d)));
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < LENGTH - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const onPaste = (i: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError("");
    fill(i, e.clipboardData.getData("text"));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const code = digits.join("");
    if (code.length < LENGTH) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError("");
    setInfo("");
    const failure = await onVerify(code);
    if (failure) {
      setBusy(false);
      setError(failure);
      setDigits(EMPTY);
      refs.current[0]?.focus();
    }
    // On success the parent unmounts this modal.
  }

  async function resend() {
    if (busy || cooldown > 0) return;
    setBusy(true);
    setError("");
    setInfo("");
    const failure = await onResend();
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    setInfo("A new code was sent.");
    setCooldown(RESEND_SECONDS);
    setDigits(EMPTY);
    refs.current[0]?.focus();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[110] flex items-center justify-center p-4 transition-opacity duration-300",
        shown ? "opacity-100 delay-150" : "opacity-0",
      )}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-[#c8933a]/40 bg-[#0a0a0a] p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h4 id={titleId} className="text-xl font-semibold text-[#f4d587]">
            Verify your email
          </h4>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close verification"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-[#efc673] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]"
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
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-white/70">
          We sent a 6-digit code to <span className="break-all text-white">{email}</span>. It
          expires in 10 minutes.
        </p>

        <form onSubmit={submit} noValidate className="mt-6">
          <div className="flex justify-between gap-2" role="group" aria-label="6-digit code">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChange={onInputChange(i)}
                onKeyDown={onKeyDown(i)}
                onPaste={onPaste(i)}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                aria-invalid={error ? true : undefined}
                className={cn(
                  "h-12 w-full min-w-0 rounded-xl border bg-white/5 text-center text-xl font-semibold text-white outline-none transition-colors focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60 sm:h-14",
                  error ? "border-red-400" : "border-white/20",
                )}
              />
            ))}
          </div>

          <div aria-live="polite" className="mt-4 min-h-6 text-sm">
            {error ? (
              <p role="alert" className="text-red-300">
                {error}
              </p>
            ) : info ? (
              <p className="text-emerald-300">{info}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 text-base font-bold text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            {busy ? "Please wait..." : "Verify code"}
          </button>

          <div className="mt-4 flex items-center justify-between gap-4 text-sm">
            <button
              type="button"
              onClick={resend}
              disabled={busy || cooldown > 0}
              className="min-h-10 font-medium text-[#f4d587] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673] disabled:cursor-not-allowed disabled:text-white/40 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 text-white/70 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}