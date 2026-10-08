"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Anton, Poppins } from "next/font/google";

import { MetallicGoldText } from "@/components/metallic-gold-text";
import { cn } from "@/lib/utils";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

export const EFFECTIVE_DATE = "[Insert Date]";

const INTRO =
  "Welcome to the PRIC-MPC online platform. These Terms and Conditions govern your registration and use of the platform and its services. By creating an account, you acknowledge that you have read, understood, and agreed to these terms.";

const SECTIONS = [
  {
    title: "1. Account Registration",
    body: "Users must provide accurate, complete, and current information during registration. Each user is responsible for maintaining the confidentiality of their account credentials and for all activities conducted through their account.",
  },
  {
    title: "2. Eligibility",
    body: "Users must provide truthful information and meet the minimum age requirement specified by PRIC-MPC. Users below the required age may only register with the consent and supervision of a parent or legal guardian, where applicable.",
  },
  {
    title: "3. Use of the Platform",
    body: "The platform may be used to browse products, place orders, communicate with the cooperative, manage account information, and access other services provided by PRIC-MPC. Users must not use the platform for fraudulent, unlawful, abusive, or unauthorized activities.",
  },
  {
    title: "4. Product Orders and Payments",
    body: "Users are responsible for reviewing their orders before submitting them. Product prices, availability, payment methods, delivery options, and applicable fees may be subject to change. PRIC-MPC reserves the right to cancel or modify an order when necessary, including in cases of incorrect information, unavailable products, or suspected fraudulent activity.",
  },
  {
    title: "5. Personal Information",
    body: "By registering, users consent to the collection and processing of their personal information as necessary to provide account, ordering, payment, delivery, and customer-support services. PRIC-MPC will handle personal information in accordance with applicable Philippine data-privacy laws and its Privacy Policy.",
  },
  {
    title: "6. Account Suspension or Termination",
    body: "PRIC-MPC may suspend or terminate an account if the user violates these Terms and Conditions, provides false information, engages in fraudulent activities, or misuses the platform.",
  },
  {
    title: "7. Platform Content",
    body: "Product descriptions, images, logos, trademarks, text, and other materials available on the platform are owned by or used with authorization by PRIC-MPC and/or its respective owners. Users may not reproduce, modify, distribute, or commercially use such content without permission.",
  },
  {
    title: "8. Changes to These Terms",
    body: "PRIC-MPC may update these Terms and Conditions when necessary. Users will be informed of significant changes through appropriate platform notifications or other available communication channels. Continued use of the platform after changes take effect constitutes acceptance of the updated terms.",
  },
  {
    title: "9. Contact and Support",
    body: "For questions, concerns, or requests regarding your account or these Terms and Conditions, users may contact PRIC-MPC through the official contact channels provided on the platform.",
  },
  {
    title: "10. Acceptance",
    body: "By checking “I agree to the Terms and Conditions” and completing registration, you confirm that you have read, understood, and agreed to these Terms and Conditions.",
  },
];

export function TermsModal({
  open,
  onClose,
  onAccept,
}: {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portal: the auth card uses backdrop-blur/overflow-hidden, which would
  // trap and clip a fixed-position modal.
  return createPortal(
    <div
      className={cn(
        poppins.className,
        "fixed inset-0 z-[100] flex items-center justify-center p-4 text-white",
      )}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="relative flex max-h-[85svh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#b9822a]/50 bg-[#0b0b0b] shadow-[0_24px_80px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <MetallicGoldText
              as="h2"
              className={anton.className}
              style={{
                display: "block",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                lineHeight: 1.15,
              }}
            >
              <span id="terms-title">Terms and Conditions</span>
            </MetallicGoldText>
            <p className="mt-1 text-xs text-white/55">
              Effective Date: {EFFECTIVE_DATE}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-[#f4d587]/60 hover:text-[#f4d587]"
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

        <div className="space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-white/80">
          <p>{INTRO}</p>
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h3 className="mb-1 font-semibold text-[#f4d587]">{s.title}</h3>
              <p>{s.body}</p>
            </section>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-full border border-white/25 px-6 text-sm font-medium text-white transition hover:border-[#f4d587]/60 hover:bg-white/5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="h-11 rounded-full px-6 text-sm font-semibold text-[#2a1802] shadow-lg transition hover:brightness-110"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            I agree
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default TermsModal;