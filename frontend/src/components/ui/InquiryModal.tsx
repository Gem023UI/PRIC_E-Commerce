"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Poppins } from "next/font/google";

import InquiryForm from "@/components/ui/InquiryForm";
import type { Service } from "@/data/services";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function InquiryModal({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [shown, setShown] = React.useState(false);
  const [otpActive, setOtpActive] = React.useState(false);

  // Fade in, lock page scroll, move focus in, restore focus on close.
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const raf = requestAnimationFrame(() => {
      setShown(true);
      rootRef.current?.querySelector<HTMLElement>("input,textarea")?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  // Escape closes (the OTP modal swallows it in the capture phase while open). Tab is trapped.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !rootRef.current) return;

      const els = [...rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.closest("[inert]") && el.getClientRects().length > 0,
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      ref={rootRef}
      className={cn(
        poppins.className,
        "fixed inset-0 z-[100] overflow-y-auto bg-black/85 text-white transition-opacity duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        shown ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="flex min-h-full items-center justify-center p-4 md:p-8"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !otpActive) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={service.form.title}
          className="w-full max-w-xl"
        >
          <InquiryForm
            service={service.id}
            title={service.form.title}
            submitLabel={service.form.submitLabel}
            notice={service.form.notice}
            messagePlaceholder={service.form.messagePlaceholder}
            onOtpActiveChange={setOtpActive}
            onClose={onClose}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}