"use client";

import * as React from "react";

import { poppins } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

// Temporary image, swap later.
export const AUTH_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/758600144_4523738007949294_7588455720974017579_n_dvtcyq.jpg";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const MailIcon = ({ className = "h-5 w-5" }) => (
  <svg {...svgProps} className={className}>
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);
export const EyeIcon = ({ className = "h-5 w-5" }) => (
  <svg {...svgProps} className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const EyeOffIcon = ({ className = "h-5 w-5" }) => (
  <svg {...svgProps} className={className}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </svg>
);
export const ArrowLeftIcon = ({ className = "h-4 w-4" }) => (
  <svg {...svgProps} className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

/** Full-screen blurred-photo backdrop shared by the auth pages. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className={cn(
        poppins.className,
        "relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-transparent px-4 py-6 text-white",
      )}
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center md:blur-xl"
          style={{ backgroundImage: `url(${AUTH_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-transparent/60" />
      </div>
      {children}
    </main>
  );
}

const INPUT =
  "h-12 w-full rounded-full border bg-white/5 px-5 pr-12 text-sm text-white outline-none transition placeholder:text-white/55 focus:bg-white/10 focus:ring-2 focus:ring-[#f4d587]/25 disabled:opacity-60";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: React.ReactNode;
  password?: boolean;
  disabled?: boolean;
};

export function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  inputMode,
  icon,
  password,
  disabled,
}: FieldProps) {
  const [show, setShow] = React.useState(false);
  const errId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={password ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={cn(
            INPUT,
            error
              ? "border-red-400/70"
              : "border-white/25 focus:border-[#f4d587]/80",
          )}
        />
        {password ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-[#f4d587]"
          >
            {show ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        ) : icon ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
            {icon}
          </span>
        ) : null}
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-1.5 px-4 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function Notice({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-2.5 text-sm",
        type === "error"
          ? "border-red-400/40 bg-red-500/10 text-red-200"
          : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
      )}
    >
      {message}
    </p>
  );
}

export function PrimaryButton({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="h-12 w-full rounded-full text-base font-semibold text-[#2a1802] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundImage: GOLD_GRADIENT }}
    >
      {busy ? "Please wait…" : children}
    </button>
  );
}