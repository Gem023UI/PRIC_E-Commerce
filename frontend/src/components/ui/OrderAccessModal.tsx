"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import EmailOtpModal from "@/components/ui/EmailOtpModal";
import { poppins } from "@/lib/fonts";
import {
  EMPTY_VALUES,
  fetchVerifiedEmail,
  requestOtp,
  setStoredEmail,
  toEmail,
  validateField,
  verifyOtp,
} from "@/lib/orders";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Props = {
  initialEmail?: string;
  onClose: () => void;
  onVerified: (email: string) => void;
};

export default function OrderAccessModal({ initialEmail = "", onClose, onVerified }: Props) {
  const uid = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [email, setEmail] = React.useState(initialEmail);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [otpEmail, setOtpEmail] = React.useState<string | null>(null);
  const [shown, setShown] = React.useState(false);

  // Fade in, lock page scroll, focus the field.
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      setShown(true);
      inputRef.current?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // While the OTP modal is open it handles Escape itself (capture phase).
  React.useEffect(() => {
    if (otpEmail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [otpEmail, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const value = toEmail(email);
    const msg = validateField("email", { ...EMPTY_VALUES, email: value });
    if (msg) {
      setError(msg);
      return;
    }

    setBusy(true);
    setError("");

    // This browser may already have proven this email.
    const verified = await fetchVerifiedEmail();
    if (verified === value) {
      setStoredEmail(value);
      setBusy(false);
      onVerified(value);
      return;
    }

    const failure = await requestOtp(value);
    setBusy(false);
    if (failure) {
      setError(failure);
      return;
    }
    setOtpEmail(value);
  }

  async function handleVerifyCode(code: string): Promise<string | null> {
    if (!otpEmail) return "Something went wrong. Please try again.";
    const failure = await verifyOtp(otpEmail, code);
    if (failure) return failure;
    onVerified(otpEmail);
    return null;
  }

  return createPortal(
    <>
      <div
        className={cn(
          poppins.className,
          "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 text-white backdrop-blur-sm transition-opacity duration-300",
          shown ? "opacity-100" : "opacity-0",
        )}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !otpEmail) onClose();
        }}
      >
        <form
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${uid}-title`}
          onSubmit={submit}
          noValidate
          inert={otpEmail !== null}
          className={cn(
            "w-full max-w-md rounded-2xl border border-[#c8933a]/40 bg-[#0a0a0a] p-6 shadow-2xl transition-opacity duration-300 md:p-8",
            otpEmail ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <h4 id={`${uid}-title`} className="text-xl font-semibold text-[#f4d587]">
              View your orders
            </h4>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
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
            Enter the email you used when ordering. We&apos;ll send a 6-digit code to confirm it&apos;s you.
          </p>

          <label htmlFor={`${uid}-email`} className="mb-2 mt-6 block text-sm font-medium">
            Email
          </label>
          <input
            ref={inputRef}
            id={`${uid}-email`}
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${uid}-err` : undefined}
            className={cn(
              "w-full min-h-12 rounded-xl border bg-white/5 px-4 py-3 text-base text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60",
              error ? "border-red-400" : "border-white/20",
            )}
          />
          <div aria-live="polite" className="mt-2 min-h-6 text-sm">
            {error && (
              <p id={`${uid}-err`} role="alert" className="text-red-300">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 text-base font-bold text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            {busy ? "Please wait..." : "Continue"}
          </button>
        </form>
      </div>

      {otpEmail ? (
        <EmailOtpModal
          email={otpEmail}
          onClose={() => setOtpEmail(null)}
          onVerify={handleVerifyCode}
          onResend={() => requestOtp(otpEmail)}
        />
      ) : null}
    </>,
    document.body,
  );
}