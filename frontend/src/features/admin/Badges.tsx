import type { AccountState } from "@/lib/admin-customers";
import {
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

const PILL = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold";

const ORDER_TONE: Record<OrderStatus, string> = {
  to_confirm: "border-amber-300/50 bg-amber-300/15 text-amber-200",
  to_ship: "border-sky-300/50 bg-sky-300/15 text-sky-200",
  on_delivery: "border-[#efc673]/60 bg-[#efc673]/20 text-[#f4d587]",
  completed: "border-emerald-300/50 bg-emerald-300/15 text-emerald-200",
  cancelled: "border-red-300/50 bg-red-300/15 text-red-200",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn(PILL, ORDER_TONE[status])}>{STATUS_LABELS[status]}</span>;
}

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  unpaid: "border-amber-300/50 bg-amber-300/15 text-amber-200",
  pending_verification: "border-sky-300/50 bg-sky-300/15 text-sky-200",
  paid: "border-emerald-300/50 bg-emerald-300/15 text-emerald-200",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn(PILL, PAYMENT_TONE[status])}>{PAYMENT_STATUS_LABELS[status]}</span>;
}

export function TypeBadge({ type }: { type: "account" | "guest" }) {
  return (
    <span
      className={cn(
        PILL,
        type === "account"
          ? "border-white/25 bg-white/10 text-white/85"
          : "border-white/15 bg-transparent text-white/60",
      )}
    >
      {type === "account" ? "Account" : "Guest"}
    </span>
  );
}

const STATE: Record<AccountState, { label: string; tone: string }> = {
  active: { label: "Active", tone: "border-emerald-300/50 bg-emerald-300/15 text-emerald-200" },
  invited: { label: "Invited", tone: "border-amber-300/50 bg-amber-300/15 text-amber-200" },
  deactivated: { label: "Deactivated", tone: "border-red-300/50 bg-red-300/15 text-red-200" },
};

export function AccountStateBadge({ state }: { state: AccountState }) {
  return <span className={cn(PILL, STATE[state].tone)}>{STATE[state].label}</span>;
}

const INQUIRY_TONE: Record<string, string> = {
  new: "border-amber-300/50 bg-amber-300/15 text-amber-200",
  contacted: "border-sky-300/50 bg-sky-300/15 text-sky-200",
  closed: "border-white/20 bg-white/5 text-white/60",
};

export function InquiryStatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(PILL, INQUIRY_TONE[status] ?? INQUIRY_TONE.closed)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}