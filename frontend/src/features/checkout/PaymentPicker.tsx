"use client";

import * as React from "react";

import { PAYMENT_LABELS, type PaymentMethod } from "@/lib/orders";
import { cn } from "@/lib/utils";

const svg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-7 w-7",
} as const;

const CashIcon = () => (
  <svg {...svg}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M6 9.5v.01M18 14.5v.01" />
  </svg>
);

const BankIcon = () => (
  <svg {...svg}>
    <path d="M3 9.5 12 4l9 5.5M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18" />
  </svg>
);

const Monogram = ({ letter, className }: { letter: string; className: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white",
      className,
    )}
  >
    {letter}
  </span>
);

const OPTIONS: { id: PaymentMethod; hint: string; icon: React.ReactNode }[] = [
  { id: "cod", hint: "Pay on arrival", icon: <CashIcon /> },
  { id: "gcash", hint: "E-wallet", icon: <Monogram letter="G" className="bg-[#0a63e6]" /> },
  { id: "paymaya", hint: "E-wallet", icon: <Monogram letter="m" className="bg-[#0f9d58]" /> },
  { id: "bank", hint: "Bank transfer", icon: <BankIcon /> },
];

type Props = {
  value: PaymentMethod | null;
  onChange: (m: PaymentMethod) => void;
  error?: string;
};

export default function PaymentPicker({ value, onChange, error }: Props) {
  return (
    <div data-invalid={error ? "true" : undefined}>
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {OPTIONS.map((o) => {
          const selected = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.id)}
              className={cn(
                "flex min-h-24 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]",
                selected
                  ? "border-[#efc673] bg-white/10 text-[#f4d587] ring-2 ring-[#efc673]/50"
                  : "border-white/20 bg-white/5 text-white/80 hover:border-white/40 hover:bg-white/10",
              )}
            >
              {o.icon}
              <span className="text-sm font-semibold">{PAYMENT_LABELS[o.id]}</span>
              <span className="text-[11px] text-white/55">{o.hint}</span>
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}