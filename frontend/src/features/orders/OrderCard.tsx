"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { PRODUCT_LIST } from "@/data/products";
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  paymentNote,
  peso,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-white/5" />,
});

const IMAGES = new Map(PRODUCT_LIST.map((p) => [p.id, p.image]));

const BADGE: Record<OrderStatus, string> = {
  to_confirm: "border-amber-300/50 bg-amber-300/15 text-amber-200",
  to_ship: "border-sky-300/50 bg-sky-300/15 text-sky-200",
  on_delivery: "border-[#efc673]/60 bg-[#efc673]/20 text-[#f4d587]",
  completed: "border-emerald-300/50 bg-emerald-300/15 text-emerald-200",
  cancelled: "border-red-300/50 bg-red-300/15 text-red-200",
};

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-white/55">{label}</p>
      <div className="mt-1 font-semibold">{children}</div>
    </div>
  );
}

export default function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const a = order.address;
  const address = [a.street, `Brgy. ${a.barangay}`, a.city, a.province, a.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-2xl border border-white/15 bg-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-col gap-4 rounded-2xl p-5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673] md:flex-row md:items-center md:justify-between"
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-white/55">Tracking code</p>
          <p className="mt-1 truncate text-base font-bold tracking-wide text-[#f4d587] md:text-lg">
            {order.trackingCode}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm">
          <Stat label="Status">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-semibold",
                BADGE[order.status],
              )}
            >
              {STATUS_LABELS[order.status]}
            </span>
          </Stat>
          <Stat label="Quantity">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </Stat>
          <Stat label="Total">{peso(order.total)}</Stat>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={cn(
              "ml-auto h-5 w-5 shrink-0 text-white/70 transition-transform duration-300",
              open && "rotate-180",
            )}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-6 border-t border-white/10 p-5">
            <ul className="divide-y divide-white/10 text-sm">
              {order.items.map((i) => (
                <li key={i.productId} className="flex items-center gap-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={IMAGES.get(i.productId) ?? "/products.png"}
                    alt=""
                    className="size-12 shrink-0 object-contain"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{i.name}</p>
                    <p className="text-xs text-white/60">
                      Qty {i.quantity} &middot; {peso(i.price)} each
                    </p>
                  </div>
                  <p className="font-semibold">{peso(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/70">Subtotal</dt>
                <dd>{peso(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/70">Shipping</dt>
                <dd>{peso(order.shippingFee)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold text-[#f4d587]">
                <dt>Total</dt>
                <dd>{peso(order.total)}</dd>
              </div>
            </dl>

            <div className="grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/55">Payment</p>
                <p className="mt-1 font-semibold">
                  {PAYMENT_LABELS[order.paymentMethod]}{" "}
                  <span className="font-normal text-white/60">
                    ({order.paymentStatus === "paid" ? "Paid" : "Unpaid"})
                  </span>
                </p>
                <p className="mt-0.5 text-white/70">{paymentNote(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/55">Deliver to</p>
                <p className="mt-1 font-semibold">
                  {order.fullName} &middot; {order.phone}
                </p>
                <p className="mt-0.5 text-white/70">{address}</p>
                {a.landmark && <p className="mt-0.5 text-white/60">Note: {a.landmark}</p>}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-white/55">Placed on</p>
                <p className="mt-1">
                  {new Date(order.createdAt).toLocaleString("en-PH", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {order.notes && (
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-white/55">Order notes</p>
                  <p className="mt-1 text-white/80">{order.notes}</p>
                </div>
              )}
            </div>

            {order.status === "on_delivery" && open && (
              <div>
                <p className="mb-3 text-[11px] uppercase tracking-widest text-white/55">
                  Delivery in progress
                </p>
                <DeliveryMap lat={a.lat} lng={a.lng} />
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}