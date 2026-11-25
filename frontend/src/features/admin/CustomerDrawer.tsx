"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import { formatDate, type CustomerDetail } from "@/lib/admin-customers";
import { formatInt, formatPeso } from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

import { AccountStateBadge, InquiryStatusBadge, OrderStatusBadge, TypeBadge } from "./Badges";
import { CloseIcon } from "./icons";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
    <p className="text-[11px] uppercase tracking-widest text-white/50">{label}</p>
    <p className="mt-1 text-lg font-bold tabular-nums text-white">{value}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-7">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    <div className="mt-3">{children}</div>
  </section>
);

type Feedback = { type: "success" | "error"; message: string } | null;

export function CustomerDrawer({
  email,
  onClose,
  onChanged,
}: {
  email: string;
  onClose: () => void;
  /** Called after an account change so the page can refresh its numbers and list. */
  onChanged: () => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = React.useState<CustomerDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [feedback, setFeedback] = React.useState<Feedback>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await adminApi<CustomerDetail>(
          `/api/admin/customers/detail?email=${encodeURIComponent(email)}`,
          { signal: ctrl.signal },
        );
        if (r.ok && r.data.customer) {
          setDetail(r.data as CustomerDetail);
          setError(null);
        } else {
          setError(r.status === 404 ? "This customer could not be found." : "We couldn't load this customer.");
        }
      } catch {
        /* aborted */
      }
    })();
    return () => ctrl.abort();
  }, [email, tick]);

  // Escape closes, page scroll is locked, focus moves in.
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

  const c = detail?.customer;

  async function run(action: () => ReturnType<typeof adminApi>, success: string) {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    const r = await action();
    setBusy(false);
    setConfirming(false);
    if (!r.ok) {
      setFeedback({ type: "error", message: r.data.message ?? "Something went wrong. Please try again." });
      return;
    }
    setFeedback({ type: "success", message: success });
    setTick((t) => t + 1);
    onChanged();
  }

  const resend = () =>
    run(
      () => adminApi(`/api/admin/users/${c!.userId}/resend-invite`, { method: "POST" }),
      `Invitation sent to ${email}.`,
    );

  const setStatus = (status: "active" | "deactivated") =>
    run(
      () => adminApi(`/api/admin/users/${c!.userId}/status`, { method: "PATCH", body: { status } }),
      status === "deactivated" ? "Account deactivated and signed out." : "Account reactivated.",
    );

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Customer details"
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            {c ? (
              <>
                <h2 className="truncate text-xl font-bold text-white">{c.name || c.email}</h2>
                <p className="mt-0.5 truncate text-sm text-white/60">{c.email}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <TypeBadge type={c.type} />
                  {c.accountState && <AccountStateBadge state={c.accountState} />}
                </div>
              </>
            ) : (
              <div className="space-y-2" aria-hidden>
                <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-60 animate-pulse rounded bg-white/5" />
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

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-2">
          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          {c && detail && (
            <>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-white/45">Phone</dt>
                  <dd className="mt-0.5 text-white/90">{c.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-white/45">
                    {c.type === "account" ? "Registered" : "First order"}
                  </dt>
                  <dd className="mt-0.5 text-white/90">
                    {formatDate(c.type === "account" ? c.registeredAt : c.firstOrderAt)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <Stat label="Orders" value={formatInt(c.orders)} />
                <Stat label="Lifetime spend" value={formatPeso(c.spent)} />
                <Stat label="First order" value={formatDate(c.firstOrderAt)} />
                <Stat label="Last order" value={formatDate(c.lastOrderAt)} />
              </div>
              {c.cancelled > 0 && (
                <p className="mt-2 text-xs text-white/50">
                  {formatInt(c.cancelled)} cancelled {c.cancelled === 1 ? "order" : "orders"} not counted above.
                </p>
              )}

              <Section title="Recent orders">
                {detail.orders.length === 0 ? (
                  <p className="text-sm text-white/55">No orders yet.</p>
                ) : (
                  <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
                    {detail.orders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold tracking-wide text-[#f4d587]">
                            {o.trackingCode}
                          </p>
                          <p className="mt-1 text-xs text-white/50">
                            {formatDate(o.createdAt)} · {formatInt(o.itemCount)}{" "}
                            {o.itemCount === 1 ? "item" : "items"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <OrderStatusBadge status={o.status} />
                          <span className="text-sm font-semibold tabular-nums text-white">
                            {formatPeso(o.total)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Inquiries">
                {detail.inquiries.length === 0 ? (
                  <p className="text-sm text-white/55">No inquiries from this email.</p>
                ) : (
                  <ul className="space-y-3">
                    {detail.inquiries.map((q, i) => (
                      <li key={i} className="rounded-xl border border-white/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{q.serviceLabel}</p>
                          <InquiryStatusBadge status={q.status} />
                        </div>
                        <p className="mt-1 text-xs text-white/50">{formatDate(q.createdAt)}</p>
                        <p className="mt-2 text-sm leading-snug text-white/75">{q.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Account">
                {c.type === "guest" ? (
                  <p className="text-sm text-white/60">
                    This customer checks out as a guest and has no account to manage.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-white/60">
                      {c.accountState === "invited"
                        ? "Waiting for the customer to set a password from their invitation email."
                        : c.accountState === "deactivated"
                          ? "Deactivated accounts can't sign in."
                          : "Active. The customer can sign in."}
                    </p>

                    {feedback && (
                      <p
                        role={feedback.type === "error" ? "alert" : "status"}
                        className={cn(
                          "rounded-xl border px-4 py-2.5 text-sm",
                          feedback.type === "error"
                            ? "border-red-400/30 bg-red-500/10 text-red-200"
                            : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                        )}
                      >
                        {feedback.message}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {c.accountState === "invited" && (
                        <button
                          type="button"
                          onClick={resend}
                          disabled={busy}
                          className="rounded-full border border-[#c8933a] px-4 py-2 text-sm font-semibold text-[#f4d587] transition-colors hover:bg-[#c8933a]/15 disabled:opacity-60"
                        >
                          {busy ? "Sending…" : "Resend invitation"}
                        </button>
                      )}

                      {c.accountState === "deactivated" ? (
                        <button
                          type="button"
                          onClick={() => setStatus("active")}
                          disabled={busy}
                          className="rounded-full border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/10 disabled:opacity-60"
                        >
                          {busy ? "Working…" : "Reactivate account"}
                        </button>
                      ) : confirming ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setStatus("deactivated")}
                            disabled={busy}
                            className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                          >
                            {busy ? "Working…" : "Yes, deactivate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(false)}
                            className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white/40"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirming(true)}
                          disabled={busy}
                          className="rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-400/10 disabled:opacity-60"
                        >
                          Deactivate account
                        </button>
                      )}
                    </div>
                    {confirming && (
                      <p className="text-xs text-white/50">
                        They will be signed out right away and can&apos;t log in until reactivated.
                      </p>
                    )}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}