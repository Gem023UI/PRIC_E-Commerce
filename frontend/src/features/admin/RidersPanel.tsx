"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { RiderRow } from "@/lib/admin-orders";
import { formatInt } from "@/lib/admin-stats";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { AccountStateBadge } from "./badges";
import { CARD } from "./ui";

type Notice = { type: "success" | "error"; message: string } | null;

const BTN = "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

export function RidersPanel({
  riders,
  error,
  onAdd,
  onChanged,
}: {
  riders: RiderRow[] | null;
  error: string | null;
  onAdd: () => void;
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<Notice>(null);

  async function run(id: string, call: () => ReturnType<typeof adminApi>, success: string) {
    if (busyId) return;
    setBusyId(id);
    setNotice(null);
    const r = await call();
    setBusyId(null);
    setConfirmId(null);
    if (!r.ok) {
      setNotice({ type: "error", message: r.data.message ?? "Something went wrong. Please try again." });
      return;
    }
    setNotice({ type: "success", message: success });
    onChanged();
  }

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Riders">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Riders</h2>
          <p className="mt-1 text-sm text-white/60">Delivery riders and their current workload.</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="rounded-full px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
          style={{ backgroundImage: GOLD_GRADIENT }}
        >
          Add rider
        </button>
      </div>

      {notice && (
        <p
          role={notice.type === "error" ? "alert" : "status"}
          className={cn(
            "mt-4 rounded-xl border px-4 py-2.5 text-sm",
            notice.type === "error"
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
          )}
        >
          {notice.message}
        </p>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

      {!riders ? (
        <div className="mt-5 space-y-2" aria-hidden>
          {[0, 1].map((n) => (
            <div key={n} className="h-16 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : riders.length === 0 ? (
        <p className="mt-6 text-sm text-white/55">
          No riders yet. Add a rider and they&apos;ll get an email to set their password.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-white/10">
          {riders.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3.5">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-white">{r.name}</span>
                  <AccountStateBadge state={r.accountState} />
                </p>
                <p className="truncate text-xs text-white/50">
                  {r.email}
                  {r.phone && ` · ${r.phone}`}
                </p>
              </div>

              <div className="flex items-center gap-5 text-center text-xs text-white/55">
                {[
                  ["To ship", r.toShip],
                  ["On delivery", r.onDelivery],
                  ["Delivered", r.completed],
                ].map(([label, n]) => (
                  <div key={label as string}>
                    <p className="text-base font-bold tabular-nums text-white">{formatInt(n as number)}</p>
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {r.accountState === "invited" && (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() =>
                      run(r.id, () => adminApi(`/api/admin/users/${r.id}/resend-invite`, { method: "POST" }), `Invitation sent to ${r.email}.`)
                    }
                    className={cn(BTN, "border-[#c8933a] text-[#f4d587] hover:bg-[#c8933a]/15")}
                  >
                    Resend invite
                  </button>
                )}
                {r.accountState === "deactivated" ? (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    onClick={() =>
                      run(r.id, () => adminApi(`/api/admin/users/${r.id}/status`, { method: "PATCH", body: { status: "active" } }), `${r.name} reactivated.`)
                    }
                    className={cn(BTN, "border-emerald-300/40 text-emerald-200 hover:bg-emerald-400/10")}
                  >
                    Reactivate
                  </button>
                ) : confirmId === r.id ? (
                  <>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() =>
                        run(r.id, () => adminApi(`/api/admin/users/${r.id}/status`, { method: "PATCH", body: { status: "deactivated" } }), `${r.name} deactivated.`)
                      }
                      className={cn(BTN, "border-transparent bg-red-500/90 text-white hover:bg-red-500")}
                    >
                      Yes, deactivate
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className={cn(BTN, "border-white/20 text-white/80 hover:border-white/40")}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(r.id)}
                    className={cn(BTN, "border-red-300/40 text-red-200 hover:bg-red-400/10")}
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}