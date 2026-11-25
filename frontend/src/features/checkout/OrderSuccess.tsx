"use client";

import * as React from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { PAYMENT_LABELS, paymentNote, peso, type Order } from "@/lib/orders";
import { GOLD_GRADIENT } from "@/lib/theme";

const GLASS = "rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl";

export default function OrderSuccess({ order }: { order: Order }) {
  const [copied, setCopied] = React.useState(false);
  const a = order.address;
  const address = [a.street, `Brgy. ${a.barangay}`, a.city, a.province, a.postalCode]
    .filter(Boolean)
    .join(", ");

  async function copy() {
    try {
      await navigator.clipboard.writeText(order.trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Reveal>
        <MetallicGoldText
          as="h1"
          fold={false}
          className="text-3xl font-bold uppercase md:text-5xl"
        >
          Order Placed
        </MetallicGoldText>
        <p className="mt-3 text-white/80">
          Thank you, {order.fullName}! A confirmation with your tracking QR was sent to{" "}
          <span className="break-all text-white">{order.email}</span>.
        </p>
      </Reveal>

      <Reveal delay={100} className={`${GLASS} mt-8 p-6 text-center`}>
        <p className="text-xs uppercase tracking-widest text-white/60">Tracking code</p>
        <div className="mt-2 flex items-center justify-center gap-3">
          <p className="text-xl font-bold tracking-wider text-[#f4d587] md:text-2xl">
            {order.trackingCode}
          </p>
          <button
            type="button"
            onClick={copy}
            className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/80 transition-colors hover:border-[#efc673] hover:text-white"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="mx-auto mt-5 w-fit rounded-xl bg-white p-3">
          <QRCodeSVG value={order.trackingUrl} size={176} marginSize={1} />
        </div>
        <p className="mt-3 text-xs text-white/60">
          Keep this QR code handy. It will be scanned when your order is delivered.
        </p>
      </Reveal>

      <Reveal delay={200} className={`${GLASS} mt-6 p-6`}>
        <h2 className="text-lg font-semibold">Order details</h2>
        <ul className="mt-4 divide-y divide-white/10 text-sm">
          {order.items.map((i) => (
            <li key={i.productId} className="flex items-center justify-between gap-4 py-2.5">
              <span className="min-w-0 flex-1">
                {i.name} <span className="text-white/60">x{i.quantity}</span>
              </span>
              <span className="font-semibold">{peso(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
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

        <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Payment</p>
            <p className="mt-1 font-semibold">{PAYMENT_LABELS[order.paymentMethod]}</p>
            <p className="mt-0.5 text-white/70">{paymentNote(order.paymentMethod)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Deliver to</p>
            <p className="mt-1 font-semibold">
              {order.fullName} &middot; {order.phone}
            </p>
            <p className="mt-0.5 text-white/70">{address}</p>
          </div>
        </div>
      </Reveal>

      <Reveal delay={300} className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/orders"
          className="rounded-lg px-7 py-2.5 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.03]"
          style={{ backgroundImage: GOLD_GRADIENT }}
        >
          View my orders
        </Link>
        <Link
          href="/products"
          className="rounded-lg border border-white/30 px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#efc673]"
        >
          Continue shopping
        </Link>
      </Reveal>
    </div>
  );
}