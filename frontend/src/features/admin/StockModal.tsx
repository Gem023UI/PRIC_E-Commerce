"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import { REASON_LABELS, type AdminProduct, type ProductDetail } from "@/lib/admin-products";
import { formatInt } from "@/lib/admin-stats";
import { formatDateTime } from "@/lib/admin-orders";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { StockBadge } from "./badges";
import { CloseIcon } from "./icons";

type Mode = "add" | "remove" | "set";

const MODES: { key: Mode; label: string }[] = [
  { key: "add", label: "Add stock" },
  { key: "remove", label: "Remove stock" },
  { key: "set", label: "Set exact count" },
];

export function StockModal({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = React.useId();
  const qtyRef = React.useRef<HTMLInputElement>(null);

  const [detail, setDetail] = React.useState<ProductDetail | null>(null);
  const [mode, setMode] = React.useState<Mode>("add");
  const [qty, setQty] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await adminApi<ProductDetail>(`/api/admin/products/${product.id}`, { signal: ctrl.signal });
        if (r.ok && r.data.product) setDetail(r.data as ProductDetail);
      } catch {
        /* aborted */
      }
    })();
    return () => ctrl.abort();
  }, [product.id]);

  React.useEffect(() => {
    qtyRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const current = detail?.product.stock ?? product.stock;
  const n = Number(qty);
  const valid = qty.trim() !== "" && Number.isInteger(n) && n >= (mode === "set" ? 0 : 1) && n <= 1_000_000;
  const result = !valid ? null : mode === "add" ? current + n : mode === "remove" ? current - n : n;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!valid) {
      setError(mode === "set" ? "Enter a whole number, 0 or more." : "Enter a whole number, 1 or more.");
      return;
    }
    if (result !== null && result < 0) {
      setError(`Only ${formatInt(current)} in stock, so you can't remove ${formatInt(n)}.`);
      return;
    }

    setBusy(true);
    setError("");
    const r = await adminApi(`/api/admin/products/${product.id}/stock`, {
      method: "POST",
      body: { mode, quantity: n, ...(note.trim() ? { note: note.trim() } : {}) },
    });
    setBusy(false);

    if (r.ok) {
      onSaved(`Stock for ${product.name} is now ${formatInt(result ?? 0)}.`);
      return;
    }
    setError(r.data.errors?.quantity ?? r.data.errors?.note ?? r.data.message ?? "We couldn't update the stock. Please try again.");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:items-center">
      <div className="fixed inset-0 bg-black/75" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={submit}
        noValidate
        className="relative my-6 w-full max-w-lg rounded-2xl border border-[#c8933a]/40 bg-[#0a0a0a] p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id={`${uid}-title`} className="text-xl font-semibold text-[#f4d587]">
              Adjust stock
            </h2>
            <p className="mt-1 truncate text-sm text-white/65">{product.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/50">In stock now</p>
            <p className="text-2xl font-bold tabular-nums text-white">{formatInt(current)}</p>
          </div>
          <StockBadge status={detail?.product.status ?? product.status} />
        </div>

        <div role="radiogroup" aria-label="Adjustment type" className="mt-5 grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <label
              key={m.key}
              className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-2 py-2.5 text-center text-sm font-medium transition-colors has-[:checked]:border-[#efc673] has-[:checked]:bg-[#efc673]/15 has-[:checked]:text-[#f4d587] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#efc673]/60"
            >
              <input
                type="radio"
                name={`${uid}-mode`}
                checked={mode === m.key}
                onChange={() => {
                  setMode(m.key);
                  setError("");
                }}
                className="sr-only"
              />
              {m.label}
            </label>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor={`${uid}-qty`} className="mb-1.5 block text-sm font-medium text-white">
              {mode === "set" ? "New stock count" : "Quantity"}
            </label>
            <input
              ref={qtyRef}
              id={`${uid}-qty`}
              value={qty}
              onChange={(e) => {
                setQty(e.target.value);
                setError("");
              }}
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              className={cn(
                "w-full min-h-11 rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60",
                error ? "border-red-400" : "border-white/15",
              )}
            />
            {result !== null && result >= 0 && (
              <p className="mt-1.5 text-sm text-white/65">
                Stock will be <span className="font-semibold text-white">{formatInt(result)}</span>.
              </p>
            )}
          </div>

          <div>
            <label htmlFor={`${uid}-note`} className="mb-1.5 block text-sm font-medium text-white">
              Note <span className="text-white/50">(optional)</span>
            </label>
            <input
              id={`${uid}-note`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="e.g. New batch delivered, damaged units, recount"
              autoComplete="off"
              className="w-full min-h-11 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60"
            />
          </div>
        </div>

        <div aria-live="polite" className="mt-3 min-h-5">
          {error && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-[#efc673]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="min-h-11 rounded-xl px-6 text-sm font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            {busy ? "Saving…" : "Update stock"}
          </button>
        </div>

        <section className="mt-7 border-t border-white/10 pt-5">
          <h3 className="text-sm font-semibold text-white">Recent stock changes</h3>
          {!detail ? (
            <p className="mt-3 text-sm text-white/50">Loading…</p>
          ) : detail.movements.length === 0 ? (
            <p className="mt-3 text-sm text-white/50">No stock changes recorded yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10 text-sm">
              {detail.movements.map((m, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-white/85">
                      {REASON_LABELS[m.reason]}
                      {m.note && <span className="text-white/50"> · {m.note}</span>}
                    </p>
                    <p className="text-xs text-white/45">
                      {formatDateTime(m.createdAt)}
                      {m.by && ` · ${m.by}`}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("font-semibold tabular-nums", m.delta > 0 ? "text-emerald-300" : "text-red-300")}>
                      {m.delta > 0 ? "+" : "−"}
                      {formatInt(Math.abs(m.delta))}
                    </p>
                    <p className="text-xs tabular-nums text-white/45">now {formatInt(m.balance)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </form>
    </div>
  );
}