"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import { formatDateTime, type AdminOrderDetail, type RiderRow } from "@/lib/admin-orders";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { PRODUCT_LIST } from "@/data/products";
import {
  PAYMENT_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

import { OrderStatusBadge, PaymentBadge } from "./badges";
import { CloseIcon } from "./icons";

const IMAGES = new Map(PRODUCT_LIST.map((p) => [p.id, p.image]));

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-7">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    <div className="mt-3">{children}</div>
  </section>
);

const BTN = "rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

function actionLabel(from: OrderStatus, to: OrderStatus) {
  if (to === "to_ship" && from === "to_confirm") return "Confirm order";
  if (to === "to_ship") return "Return to shipping";
  if (to === "completed") return "Mark as delivered";
  return "Cancel order";
}

type Pending = { to: OrderStatus; note: string };
type Feedback = { type: "success" | "error"; message: string } | null;

type TimelineEvent = { at: string; label: string; detail: string };

function buildTimeline(o: AdminOrderDetail): TimelineEvent[] {
  const events: TimelineEvent[] = [{ at: o.createdAt, label: "Order placed", detail: "" }];
  for (const h of o.history) {
    events.push({
      at: h.at,
      label: STATUS_LABELS[h.status],
      detail: [h.by && `by ${h.by}`, h.note].filter(Boolean).join(" · "),
    });
  }
  // Orders edited by hand in the database may lack history entries.
  if (o.completedAt && !o.history.some((h) => h.status === "completed")) {
    events.push({ at: o.completedAt, label: STATUS_LABELS.completed, detail: "" });
  }
  if (o.cancelledAt && !o.history.some((h) => h.status === "cancelled")) {
    events.push({ at: o.cancelledAt, label: STATUS_LABELS.cancelled, detail: o.cancelReason });
  }
  if (o.riderAssignedAt && o.rider) {
    events.push({ at: o.riderAssignedAt, label: "Rider assigned", detail: o.rider.name });
  }
  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

export function OrderDrawer({
  id,
  riders,
  onClose,
  onChanged,
}: {
  id: string;
  riders: RiderRow[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [order, setOrder] = React.useState<AdminOrderDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [pending, setPending] = React.useState<Pending | null>(null);
  const [pendingError, setPendingError] = React.useState("");
  const [feedback, setFeedback] = React.useState<Feedback>(null);
  const [riderChoice, setRiderChoice] = React.useState("");

  React.useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await adminApi<{ order: AdminOrderDetail }>(`/api/admin/orders/${id}`, {
          signal: ctrl.signal,
        });
        if (r.ok && r.data.order) setOrder(r.data.order);
        else setError(r.status === 404 ? "This order could not be found." : "We couldn't load this order.");
      } catch {
        /* aborted */
      }
    })();
    return () => ctrl.abort();
  }, [id]);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const timeline = React.useMemo(() => (order ? buildTimeline(order) : []), [order]);
  const activeRiders = riders.filter((r) => r.accountState === "active");

  async function mutate(path: string, body: unknown, success: string) {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    setPendingError("");
    const r = await adminApi<{ order: AdminOrderDetail }>(`/api/admin/orders/${id}/${path}`, {
      method: "POST",
      body,
    });
    setBusy(false);
    if (!r.ok || !r.data.order) {
      const msg = r.data.errors?.note ?? r.data.message ?? "Something went wrong. Please try again.";
      if (pending) setPendingError(msg);
      else setFeedback({ type: "error", message: msg });
      return;
    }
    setOrder(r.data.order);
    setPending(null);
    setRiderChoice("");
    setFeedback({ type: "success", message: success });
    onChanged();
  }

  const changeStatus = () => {
    if (!pending) return;
    void mutate(
      "status",
      { status: pending.to, ...(pending.note.trim() ? { note: pending.note.trim() } : {}) },
      `Order marked as ${STATUS_LABELS[pending.to].toLowerCase()}.`,
    );
  };

  const setPayment = (paymentStatus: PaymentStatus) =>
    mutate("payment", { paymentStatus }, `Payment marked as ${PAYMENT_STATUS_LABELS[paymentStatus].toLowerCase()}.`);

  const a = order?.address;
  const address = a
    ? [a.street, `Brgy. ${a.barangay}`, a.city, a.province, a.postalCode].filter(Boolean).join(", ")
    : "";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
        className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            {order ? (
              <>
                <p className="truncate font-mono text-lg font-bold tracking-wide text-[#f4d587]">
                  {order.trackingCode}
                </p>
                <p className="mt-0.5 text-sm text-white/55">Placed {formatDateTime(order.createdAt)}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <OrderStatusBadge status={order.status} />
                  <PaymentBadge status={order.paymentStatus} />
                </div>
              </>
            ) : (
              <div className="space-y-2" aria-hidden>
                <div className="h-6 w-56 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
              </div>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-1">
          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {order && a && (
            <>
              {feedback && (
                <p
                  role={feedback.type === "error" ? "alert" : "status"}
                  className={cn(
                    "mt-5 rounded-xl border px-4 py-2.5 text-sm",
                    feedback.type === "error"
                      ? "border-red-400/30 bg-red-500/10 text-red-200"
                      : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                  )}
                >
                  {feedback.message}
                </p>
              )}

              {/* Next steps */}
              {order.allowed.length > 0 && (
                <Section title="Update status">
                  {pending ? (
                    <div className="space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
                      <p className="text-sm text-white/85">
                        {actionLabel(order.status, pending.to)}?
                        {pending.to === "completed" &&
                          " Riders normally complete deliveries by scanning the customer's QR code. Use this only as an override."}
                      </p>
                      {(pending.to === "cancelled" || pending.to === "completed") && (
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-medium text-white">
                            {pending.to === "cancelled" ? "Reason for cancelling" : "Note"}
                            {pending.to === "completed" && <span className="text-white/50"> (optional)</span>}
                          </span>
                          <textarea
                            value={pending.note}
                            onChange={(e) => setPending({ ...pending, note: e.target.value })}
                            rows={2}
                            maxLength={200}
                            aria-invalid={pendingError ? true : undefined}
                            className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50"
                          />
                        </label>
                      )}
                      {pendingError && (
                        <p role="alert" className="text-sm text-red-300">
                          {pendingError}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={changeStatus}
                          disabled={busy}
                          className={cn(
                            BTN,
                            pending.to === "cancelled"
                              ? "bg-red-500/90 text-white hover:bg-red-500"
                              : "bg-[#efc673] text-black hover:bg-[#f4d587]",
                          )}
                        >
                          {busy ? "Working…" : `Yes, ${actionLabel(order.status, pending.to).toLowerCase()}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPending(null);
                            setPendingError("");
                          }}
                          className={cn(BTN, "border border-white/20 text-white/80 hover:border-white/40")}
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {order.allowed.map((to) => (
                        <button
                          key={to}
                          type="button"
                          onClick={() => setPending({ to, note: "" })}
                          className={cn(
                            BTN,
                            to === "cancelled"
                              ? "border border-red-300/40 text-red-200 hover:bg-red-400/10"
                              : to === "to_ship" && order.status === "to_confirm"
                                ? "bg-[#efc673] text-black hover:bg-[#f4d587]"
                                : "border border-white/25 text-white/85 hover:border-white/45",
                          )}
                        >
                          {actionLabel(order.status, to)}
                        </button>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {order.status === "cancelled" && order.cancelReason && (
                <p className="mt-5 rounded-xl border border-red-300/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  <span className="font-semibold">Cancelled:</span> {order.cancelReason}
                </p>
              )}

              {/* Rider */}
              <Section title="Rider">
                {order.status === "to_ship" ? (
                  <div className="space-y-3">
                    <p className="text-sm text-white/70">
                      {order.rider ? (
                        <>
                          Assigned to <span className="font-semibold text-white">{order.rider.name}</span>
                          {order.riderAssignedAt && ` · ${formatDateTime(order.riderAssignedAt)}`}. They&apos;ll see
                          it in their deliveries.
                        </>
                      ) : (
                        "No rider assigned yet. Assign one so the order can go out for delivery."
                      )}
                    </p>
                    {activeRiders.length === 0 ? (
                      <p className="text-sm text-orange-300">
                        No active riders. Add one in the Riders section below the order list.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <select
                          aria-label="Choose a rider"
                          value={riderChoice}
                          onChange={(e) => setRiderChoice(e.target.value)}
                          className="min-h-10 min-w-[11rem] flex-1 rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-white outline-none focus-visible:border-[#efc673] [&>option]:bg-neutral-900"
                        >
                          <option value="">{order.rider ? "Change rider…" : "Choose a rider…"}</option>
                          {activeRiders
                            .filter((r) => r.id !== order.rider?.id)
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} ({formatInt(r.toShip + r.onDelivery)} open)
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          disabled={!riderChoice || busy}
                          onClick={() => mutate("rider", { riderId: riderChoice }, "Rider assigned.")}
                          className={cn(BTN, "bg-[#efc673] text-black hover:bg-[#f4d587]")}
                        >
                          {order.rider ? "Reassign" : "Assign"}
                        </button>
                        {order.rider && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => mutate("rider", { riderId: null }, "Rider removed.")}
                            className={cn(BTN, "border border-white/20 text-white/80 hover:border-white/40")}
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/70">
                    {order.rider ? (
                      <>
                        <span className="font-semibold text-white">{order.rider.name}</span>
                        {order.status === "on_delivery" && " is out for delivery."}
                      </>
                    ) : order.status === "to_confirm" ? (
                      "Riders can be assigned once the order is confirmed and ready to ship."
                    ) : (
                      "No rider on this order."
                    )}
                  </p>
                )}
              </Section>

              {/* Payment */}
              <Section title="Payment">
                <p className="text-sm text-white/70">
                  {PAYMENT_LABELS[order.paymentMethod]} ·{" "}
                  <span className="font-semibold text-white">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
                </p>
                {order.status !== "cancelled" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.paymentStatus !== "paid" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPayment("paid")}
                        className={cn(BTN, "border border-emerald-300/40 text-emerald-200 hover:bg-emerald-400/10")}
                      >
                        Mark paid
                      </button>
                    )}
                    {order.paymentStatus !== "pending_verification" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPayment("pending_verification")}
                        className={cn(BTN, "border border-sky-300/40 text-sky-200 hover:bg-sky-400/10")}
                      >
                        Needs verification
                      </button>
                    )}
                    {order.paymentStatus !== "unpaid" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setPayment("unpaid")}
                        className={cn(BTN, "border border-white/20 text-white/80 hover:border-white/40")}
                      >
                        Mark unpaid
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-white/45">Payment can&apos;t be changed on a cancelled order.</p>
                )}
                {order.paymentMethod === "cod" && order.status !== "completed" && (
                  <p className="mt-2 text-xs text-white/45">
                    Cash on delivery is marked paid automatically when the delivery is completed.
                  </p>
                )}
              </Section>

              {/* Customer + address */}
              <Section title="Customer and delivery">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-white/45">Customer</dt>
                    <dd className="mt-0.5 text-white/90">
                      {order.fullName}
                      <span className="block text-white/60">{order.email}</span>
                      <a href={`tel:${order.phone}`} className="text-[#f4d587] hover:underline">
                        {order.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-white/45">Address</dt>
                    <dd className="mt-0.5 text-white/90">
                      {address}
                      {a.landmark && <span className="block text-white/60">Note: {a.landmark}</span>}
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${a.lat}&mlon=${a.lng}#map=18/${a.lat}/${a.lng}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-block text-[#f4d587] hover:underline"
                      >
                        View pin on map
                      </a>
                    </dd>
                  </div>
                  {order.notes && (
                    <div>
                      <dt className="text-xs uppercase tracking-widest text-white/45">Order notes</dt>
                      <dd className="mt-0.5 text-white/80">{order.notes}</dd>
                    </div>
                  )}
                </dl>
              </Section>

              {/* Items */}
              <Section title="Items">
                <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
                  {order.items.map((i) => (
                    <li key={i.productId} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={IMAGES.get(i.productId) ?? "/products.png"} alt="" className="size-10 shrink-0 object-contain" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{i.name}</p>
                        <p className="text-xs text-white/50">
                          {formatInt(i.quantity)} × {formatPeso(i.price)}
                        </p>
                      </div>
                      <p className="font-semibold tabular-nums text-white">{formatPeso(i.price * i.quantity)}</p>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-white/65">Subtotal</dt>
                    <dd className="tabular-nums">{formatPeso(order.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/65">Shipping</dt>
                    <dd className="tabular-nums">{formatPeso(order.shippingFee)}</dd>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#f4d587]">
                    <dt>Total</dt>
                    <dd className="tabular-nums">{formatPeso(order.total)}</dd>
                  </div>
                </dl>
              </Section>

              {/* Timeline */}
              <Section title="Timeline">
                <ol className="relative ml-2 space-y-4 border-l border-white/15 pl-5">
                  {timeline.map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[1.62rem] top-1.5 size-2.5 rounded-full bg-[#efc673]" />
                      <p className="text-sm font-semibold text-white">{e.label}</p>
                      <p className="text-xs text-white/50">
                        {formatDateTime(e.at)}
                        {e.detail && ` · ${e.detail}`}
                      </p>
                    </li>
                  ))}
                </ol>
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}