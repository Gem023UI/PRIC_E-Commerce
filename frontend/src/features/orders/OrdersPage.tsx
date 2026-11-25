"use client";

import * as React from "react";
import Link from "next/link";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import OrderAccessModal from "@/components/ui/OrderAccessModal";
import {
  STATUS_LABELS,
  api,
  clearGuestSession,
  fetchVerifiedSession,
  getStoredEmail,
  setStoredEmail,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { GOLD_GRADIENT } from "@/lib/theme";

import OrderCard from "./OrderCard";

const GLASS = "rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl";

const STATUS_ORDER: OrderStatus[] = [
  "on_delivery",
  "to_ship",
  "to_confirm",
  "completed",
  "cancelled",
];
const PRIORITY = Object.fromEntries(STATUS_ORDER.map((s, i) => [s, i])) as Record<OrderStatus, number>;

type Phase = "loading" | "gate" | "ready" | "error";

export function OrdersPage() {
  const filterId = React.useId();
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [source, setSource] = React.useState<"account" | "guest" | null>(null);
  const [filter, setFilter] = React.useState<"all" | OrderStatus>("all");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async () => {
    // The server cookie is the proof; localStorage is only a convenience.
    const verified = await fetchVerifiedSession();
    if (!verified) {
      setEmail(getStoredEmail() ?? "");
      setPhase("gate");
      setModalOpen(true);
      return;
    }
    setStoredEmail(verified.email);
    setEmail(verified.email);
    setSource(verified.source);

    const r = await api<{ orders: Order[] }>("/api/orders");
    if (r.status === 401) {
      setPhase("gate");
      setModalOpen(true);
      return;
    }
    if (!r.ok) {
      setPhase("error");
      return;
    }
    setOrders(r.data.orders ?? []);
    setPhase("ready");
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function switchEmail() {
    await clearGuestSession();
    setOrders([]);
    setEmail("");
    setFilter("all");
    setPhase("gate");
    setModalOpen(true);
  }

  const counts = React.useMemo(() => {
    const c = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<OrderStatus, number>;
    for (const o of orders) c[o.status] += 1;
    return c;
  }, [orders]);

  const visible = React.useMemo(
    () =>
      orders
        .filter((o) => filter === "all" || o.status === filter)
        .sort(
          (a, b) =>
            PRIORITY[a.status] - PRIORITY[b.status] ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [orders, filter],
  );

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20">
      <Reveal>
        <MetallicGoldText as="h1" fold={false} className="text-3xl font-bold uppercase md:text-5xl">
          My Orders
        </MetallicGoldText>
        {phase === "ready" && email && (
          <p className="mt-3 text-sm text-white/70">
            Showing orders for <span className="break-all text-white">{email}</span>.{" "}
            {source === "guest" && (
              <button
                type="button"
                onClick={switchEmail}
                className="text-[#f4d587] underline-offset-4 hover:underline"
              >
                Not you?
              </button>
            )}
          </p>
        )}
      </Reveal>

      {phase === "loading" && (
        <div className="mt-8 flex flex-col gap-4" aria-hidden>
          {[0, 1, 2].map((n) => (
            <div key={n} className={`${GLASS} h-24 animate-pulse`} />
          ))}
        </div>
      )}

      {phase === "gate" && (
        <Reveal className={`${GLASS} mt-10 flex flex-col items-center gap-4 px-6 py-14 text-center`}>
          <p className="text-lg">Verify your email to see your orders.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg px-7 py-2.5 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.03]"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            Verify email
          </button>
        </Reveal>
      )}

      {phase === "error" && (
        <Reveal className={`${GLASS} mt-10 flex flex-col items-center gap-4 px-6 py-14 text-center`}>
          <p className="text-lg">We couldn&apos;t load your orders.</p>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-white/30 px-7 py-2.5 text-sm font-semibold transition-colors hover:border-[#efc673]"
          >
            Try again
          </button>
        </Reveal>
      )}

      {phase === "ready" && (
        <>
          {orders.length > 0 && (
            <Reveal delay={80} className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label htmlFor={filterId} className="sr-only">
                  Filter by status
                </label>
                <select
                  id={filterId}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as "all" | OrderStatus)}
                  className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-4 text-sm text-white outline-none backdrop-blur-xl focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60 [&>option]:bg-neutral-900 [&>option]:text-white"
                >
                  <option value="all">All orders ({orders.length})</option>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]} ({counts[s]})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-5 text-sm text-white/90 backdrop-blur-xl transition-colors hover:border-[#efc673] disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </Reveal>
          )}

          {orders.length === 0 ? (
            <Reveal delay={80} className={`${GLASS} mt-10 flex flex-col items-center gap-4 px-6 py-14 text-center`}>
              <p className="text-lg">You haven&apos;t placed any orders yet.</p>
              <Link
                href="/products/#product-grid"
                className="rounded-lg px-7 py-2.5 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.03]"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                Browse Products
              </Link>
            </Reveal>
          ) : visible.length === 0 ? (
            <Reveal className={`${GLASS} mt-6 px-6 py-10 text-center text-white/80`}>
              No {STATUS_LABELS[filter as OrderStatus].toLowerCase()} orders.
            </Reveal>
          ) : (
            <ul className="mt-6 flex flex-col gap-4">
              {visible.map((o, i) => (
                <Reveal as="li" key={o.id} delay={Math.min(i, 6) * 60}>
                  <OrderCard order={o} />
                </Reveal>
              ))}
            </ul>
          )}
        </>
      )}

      {modalOpen ? (
        <OrderAccessModal
          initialEmail={email}
          onClose={() => setModalOpen(false)}
          onVerified={() => {
            setModalOpen(false);
            setPhase("loading");
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

export default OrdersPage;