"use client";

import * as React from "react";

import { GOLD_GRADIENT } from "@/lib/theme";

import { CloseIcon } from "../admin/icons";

/**
 * Full-screen camera scanner. Each decoded code is passed to onScan; the parent decides what it
 * means and shows the result. The manual field is a fallback for a missing or blocked camera
 * (cameras need HTTPS or localhost).
 */
export function QrScanner({
  busy,
  onScan,
  onClose,
}: {
  busy: boolean;
  onScan: (text: string) => void;
  onClose: () => void;
}) {
  const regionId = `qr-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const onScanRef = React.useRef(onScan);
  onScanRef.current = onScan;

  const [state, setState] = React.useState<"starting" | "scanning" | "error">("starting");
  const [message, setMessage] = React.useState("");
  const [manual, setManual] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const instance = new Html5Qrcode(regionId);
        scanner = instance;
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => onScanRef.current(text),
          () => {
            /* no code in this frame */
          },
        );
        if (!cancelled) setState("scanning");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(
          err instanceof Error && /permission|denied|notallowed/i.test(err.message)
            ? "Camera access is blocked. Allow it in your browser settings, or enter the code below."
            : "The camera couldn't start. You can enter the order code below instead.",
        );
      }
    })();

    return () => {
      cancelled = true;
      const s = scanner;
      if (s) {
        s.stop()
          .then(() => s.clear())
          .catch(() => {
            /* wasn't running */
          });
      }
    };
  }, [regionId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const text = manual.trim();
    if (text && !busy) onScan(text);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Scan QR code" className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-lg font-semibold text-white">Scan the customer&apos;s QR code</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close scanner"
          className="flex size-10 items-center justify-center rounded-full border border-white/20 text-white/85"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="mx-auto w-full max-w-md">
          <div
            id={regionId}
            className="overflow-hidden rounded-2xl border border-white/15 bg-neutral-900 [&_video]:w-full"
            style={{ minHeight: state === "error" ? 0 : 280 }}
          />
          <p aria-live="polite" className="mt-3 text-center text-sm text-white/65">
            {state === "starting" && "Starting the camera…"}
            {state === "scanning" && (busy ? "Checking…" : "Point the camera at the QR code on the customer's order.")}
            {state === "error" && <span className="text-amber-300">{message}</span>}
          </p>

          <form onSubmit={submitManual} className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
            <label htmlFor="manual-code" className="block text-sm font-medium text-white">
              Or enter the order code
            </label>
            <p className="mt-1 text-xs text-white/50">
              The customer can read it from their order, e.g. PRIC-20261124-ABC234.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                id="manual-code"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                placeholder="PRIC-00000000-XXXXXX"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-black/40 px-3 font-mono text-sm uppercase text-white outline-none placeholder:normal-case placeholder:text-white/35 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50"
              />
              <button
                type="submit"
                disabled={busy || !manual.trim()}
                className="min-h-11 rounded-xl px-5 text-sm font-bold text-black disabled:opacity-50"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default QrScanner;