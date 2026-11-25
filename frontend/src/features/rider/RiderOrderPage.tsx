"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { OrderStatusBadge } from "@/features/admin/Badges";
import { adminApi } from "@/lib/admin-api";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { PAYMENT_LABELS } from "@/lib/orders";
import { googleMapsUrl, type RiderOrderDetail } from "@/lib/rider";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { QrScanner } from "./QrScanner";
import { ToastStack, useToasts } from "./ScanToasts";

const DeliveryNavigator = dynamic(() => import("./DeliveryNavigator"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-white/5" />,
});

const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-white/10 bg-black p-4">
    {title && <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">{title}</h2>}
    {children}
  </section>
);

export function RiderOrderPage({ id }: { id: string }) {
  const [order, setOrder] = React.useState<RiderOrderDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [packageOk, setPackageOk] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState("");
  const [scanning, setScanning] = React.useState(false);
  const [scanBusy, setScanBusy] = React.useState(false);
  const { toasts, push, dismiss } = useToasts();

  const lastScan = React.useRef<{ text: string; at: number } | null>(null);
  const scanBusyRef = React.useRef(false);

  React.useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await adminApi<{ order: RiderOrderDetail }>(`/api/rider/orders/${id}`, { signal: ctrl.signal });
        if (r.ok && r.data.order) setOrder(r.data.order);
        else setError(r.status === 404 ? "This order isn't assigned to you." : "We couldn't load this order.");
      } catch {
        /* aborted */
      }
    })();
    return () => ctrl.abort();
  }, [id]);

  async function startDelivery() {
    if (!packageOk || starting) return;
    setStarting(true);
    setStartError("");
    const r = await adminApi<{ order: RiderOrderDetail }>(`/api/rider/orders/${id}/start`, {
      method: "POST",
      body: { packageComplete: true },
    });
    setStarting(false);
    if (r.ok && r.data.order) {
      setOrder(r.data.order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStartError(r.data.errors?.packageComplete ?? r.data.message ?? "We couldn't start the delivery. Please try again.");
    }
  }

  async function handleScan(text: string) {
    const now = Date.now();
    if (scanBusyRef.current) return;
    // The camera reports the same code many times a second; judge it once.
    if (lastScan.current && lastScan.current.text === text && now - lastScan.current.at < 3000) return;
    lastScan.current = { text, at: now };

    scanBusyRef.current = true;
    setScanBusy(true);
    const r = await adminApi<{ message: string; order: RiderOrderDetail }>(`/api/rider/orders/${id}/scan`, {
      method: "POST",
      body: { code: text },
    });
    scanBusyRef.current = false;
    setScanBusy(false);

    if (r.ok && r.data.order) {
      navigator.vibrate?.(80);
      push({ type: "success", title: "Scan successful", description: r.data.message ?? "Delivery confirmed." });
      setOrder(r.data.order);
      setScanning(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigator.vibrate?.([60, 40, 60]);
      push({
        type: "error",
        title: "Scan failed",
        description: r.data.errors?.code ?? r.data.message ?? "Something went wrong. Please try again.",
      });
    }
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black px-6 py-12 text-center">
        <p role="alert" className="text-white/80">
          {error}
        </p>
        <Link href="/rider/orders" className="mt-5 inline-block text-sm font-semibold text-[#f4d587] hover:underline">
          Back to my deliveries
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
      </div>
    );
  }

  const a = order.address;
  const address = [a.street, `Brgy. ${a.barangay}`, a.city, a.province, a.postalCode].filter(Boolean).join(", ");
  const inTransit = order.status === "on_delivery";
  const finished = order.status === "completed";

  return (
    <div className="space-y-4 pb-8">
      <ToastStack toasts={toasts} dismiss={dismiss} />

      <Link href="/rider/orders" className="inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white">
        ← My deliveries
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-bold tracking-wide text-[#f4d587]">{order.ref}</p>
          <h1 className="mt-1 truncate text-2xl font-bold text-white">{order.fullName}</h1>
        </div>
        <OrderStatusBadge status={order.status === "on_delivery" ? "on_delivery" : order.status === "completed" ? "completed" : "to_ship"} />
      </div>

      {/* Delivered */}
      {finished && (
        <div role="status" className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-5 py-6 text-center">
          <p className="text-lg font-bold text-emerald-200">Delivered</p>
          <p className="mt-1 text-sm text-emerald-100/80">This order is complete. Thank you!</p>
          <Link
            href="/rider/orders"
            className="mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-bold text-black"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            Back to my deliveries
          </Link>
        </div>
      )}

      {/* Delivery mode: map plus the scan button, on the same screen */}
      {inTransit && (
        <>
          <DeliveryNavigator dest={{ lat: a.lat, lng: a.lng }} />
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="w-full rounded-2xl py-4 text-base font-bold text-black shadow-lg transition-transform active:scale-[0.99]"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            Scan QR code
          </button>
          <p className="text-center text-xs text-white/50">
            Ask the customer for the QR code from their order, then scan it to complete the delivery.
          </p>
        </>
      )}

      {/* Payment to collect */}
      <Card title="Payment">
        {order.collectAmount > 0 ? (
          <p className="text-base">
            Collect <span className="text-2xl font-bold tabular-nums text-orange-300">{formatPeso(order.collectAmount)}</span>{" "}
            <span className="text-white/60">in cash</span>
          </p>
        ) : (
          <p className="text-sm text-white/75">
            {PAYMENT_LABELS[order.paymentMethod]} · nothing to collect at the door.
          </p>
        )}
      </Card>

      {/* Customer + address */}
      <Card title="Delivery">
        <p className="text-base font-semibold text-white">{order.fullName}</p>
        <a
          href={`tel:${order.phone}`}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-[#f4d587]"
        >
          Call {order.phone}
        </a>
        <p className="mt-4 text-sm leading-relaxed text-white/85">{address}</p>
        {a.landmark && <p className="mt-1 text-sm text-white/60">Landmark: {a.landmark}</p>}
        {order.notes && <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-sm text-white/75">Order note: {order.notes}</p>}
        {!inTransit && (
          <a
            href={googleMapsUrl(a.lat, a.lng)}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-block text-sm font-semibold text-[#f4d587] hover:underline"
          >
            Open in Google Maps
          </a>
        )}
      </Card>

      {/* Items */}
      <Card title={`Items (${formatInt(order.itemCount)})`}>
        <ul className="divide-y divide-white/10">
          {order.items.map((i) => (
            <li key={i.productId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image || "/products.png"} alt="" className="size-12 shrink-0 object-contain" />
              <p className="min-w-0 flex-1 text-sm text-white">{i.name}</p>
              <p className="shrink-0 text-lg font-bold tabular-nums text-[#f4d587]">×{formatInt(i.quantity)}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Before leaving: confirm the package, then start (at the very bottom) */}
      {order.status === "to_ship" && (
        <Card>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
            <input
              type="checkbox"
              checked={packageOk}
              onChange={(e) => setPackageOk(e.target.checked)}
              className="mt-0.5 size-6 shrink-0 accent-[#efc673]"
            />
            <span>
              I&apos;ve checked the package against the items above. <strong className="text-white">The package is complete.</strong>
            </span>
          </label>

          {startError && (
            <p role="alert" className="mt-3 text-sm text-red-300">
              {startError}
            </p>
          )}

          <button
            type="button"
            onClick={startDelivery}
            disabled={!packageOk || starting}
            aria-busy={starting}
            className={cn(
              "mt-4 w-full rounded-2xl py-4 text-base font-bold transition-opacity",
              packageOk ? "text-black" : "cursor-not-allowed bg-white/10 text-white/40",
              starting && "opacity-70",
            )}
            style={packageOk ? { backgroundImage: GOLD_GRADIENT } : undefined}
          >
            {starting ? "Starting…" : "Proceed to delivery"}
          </button>
        </Card>
      )}

      {scanning && <QrScanner busy={scanBusy} onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  );
}

export default RiderOrderPage;