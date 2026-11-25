"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { AdminEvent } from "@/lib/admin-engagement";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { EventFormModal } from "./EventFormModal";
import { CARD } from "./ui";
import { useAdminData } from "./use-admin-data";

const BTN = "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

export function EventsPanel({ onChanged }: { onChanged: () => void }) {
  const { data, error, reload } = useAdminData<{ events: AdminEvent[] }>("/api/admin/events");
  const [filter, setFilter] = React.useState<"all" | "upcoming" | "latest">("all");
  const [editing, setEditing] = React.useState<AdminEvent | "new" | null>(null);
  const [confirmId, setConfirmId] = React.useState<number | null>(null);
  const [busyId, setBusyId] = React.useState<number | null>(null);
  const [notice, setNotice] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const close = React.useCallback(() => setEditing(null), []);

  const events = (data?.events ?? []).filter((e) => filter === "all" || e.status === filter);

  async function remove(e: AdminEvent) {
    setBusyId(e.id);
    const r = await adminApi(`/api/admin/events/${e.id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmId(null);
    if (!r.ok) return setNotice({ type: "error", message: r.data.message ?? "We couldn't delete that event." });
    setNotice({ type: "success", message: `${e.title} was deleted.` });
    reload();
    onChanged();
  }

  const chips: ["all" | "upcoming" | "latest", string][] = [
    ["all", "All"],
    ["upcoming", "Upcoming"],
    ["latest", "Past"],
  ];

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Events">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Events</h2>
          <p className="mt-1 text-sm text-white/60">Shown on the Events page and the home page carousel.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="rounded-full px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-[1.03]" style={{ backgroundImage: GOLD_GRADIENT }}>
          Add event
        </button>
      </div>

      <div role="group" aria-label="Event type" className="mt-5 flex gap-1.5">
        {chips.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm transition-colors", filter === value ? "border-[#efc673]/60 bg-[#efc673]/15 font-semibold text-[#f4d587]" : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white")}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <p role={notice.type === "error" ? "alert" : "status"} className={cn("mt-4 rounded-xl border px-4 py-2.5 text-sm", notice.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200")}>
          {notice.message}
        </p>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

      {!data ? (
        <div className="mt-5 space-y-2" aria-hidden>
          {[0, 1, 2].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="px-2 py-10 text-center text-sm text-white/55">
          {data.events.length === 0 ? "No events yet. Add one, or run the events seed script." : "No events in this group."}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
              <div className="flex min-w-[15rem] flex-1 items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.images[0] || "/community.jpg"} alt="" className="size-14 shrink-0 rounded-lg bg-white/5 object-cover" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-white">{e.title}</p>
                  <p className="mt-0.5 text-xs text-white/55">
                    {e.dateLabel} · {e.location}
                  </p>
                </div>
              </div>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", e.status === "upcoming" ? "border-[#efc673]/50 bg-[#efc673]/15 text-[#f4d587]" : "border-white/20 bg-white/5 text-white/60")}>
                {e.status === "upcoming" ? "Upcoming" : "Past"}
              </span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditing(e)} className={cn(BTN, "border-white/25 text-white/85 hover:border-white/45")}>
                  Edit
                </button>
                {confirmId === e.id ? (
                  <>
                    <button type="button" disabled={busyId === e.id} onClick={() => remove(e)} className={cn(BTN, "border-transparent bg-red-500/90 text-white hover:bg-red-500")}>
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className={cn(BTN, "border-white/20 text-white/80 hover:border-white/40")}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmId(e.id)} className={cn(BTN, "border-red-300/40 text-red-200 hover:bg-red-400/10")}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EventFormModal
          event={editing === "new" ? undefined : editing}
          onClose={close}
          onSaved={(message) => {
            setEditing(null);
            setNotice({ type: "success", message });
            reload();
            onChanged();
          }}
        />
      )}
    </section>
  );
}