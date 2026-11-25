"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type Toast = { id: number; type: "success" | "error"; title: string; description: string };

export function useToasts() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-2), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}

/** Floating result of every scan attempt: green for success, red for failure, with the reason. */
export function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur",
            t.type === "success"
              ? "border-emerald-300/40 bg-emerald-950/95 text-emerald-50"
              : "border-red-300/40 bg-red-950/95 text-red-50",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              t.type === "success" ? "bg-emerald-400 text-emerald-950" : "bg-red-400 text-red-950",
            )}
          >
            {t.type === "success" ? "✓" : "✕"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            <p className="mt-0.5 text-sm leading-snug opacity-90">{t.description}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="shrink-0 rounded-full px-1.5 text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}