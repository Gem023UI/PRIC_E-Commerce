"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import OrderAccessModal from "@/components/ui/OrderAccessModal";
import { useSession } from "@/hooks/use-session";
import { getStoredEmail } from "@/lib/orders";

/** Header icon: stored email -> straight to /orders, otherwise ask for it first. */
export function OrderLink({ className }: { className?: string }) {
  const router = useRouter();
  const { user } = useSession();
  const [open, setOpen] = React.useState(false);

  function handleClick() {
    if (user || getStoredEmail()) router.push("/orders");
    else setOpen(true);
  }

  return (
    <>
      <button type="button" aria-label="My orders" onClick={handleClick} className={className}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-[18px] w-[18px]"
          aria-hidden="true"
        >
          <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
          <path d="M3 8l9 5 9-5M12 13v8" />
        </svg>
      </button>

      {open ? (
        <OrderAccessModal
          onClose={() => setOpen(false)}
          onVerified={() => {
            setOpen(false);
            router.push("/orders");
          }}
        />
      ) : null}
    </>
  );
}