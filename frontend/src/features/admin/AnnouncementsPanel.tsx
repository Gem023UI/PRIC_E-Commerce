"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { AdminAnnouncement, AnnouncementState } from "@/lib/admin-engagement";
import { formatSpan } from "@/lib/dates";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { AnnouncementFormModal } from "./AnnouncementFormModal";
import { CARD } from "./ui";
import { useAdminData } from "./use-admin-data";

const BTN = "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

const STATE: Record<AnnouncementState, { label: string; tone: string }> = {
  active: { label: "Active", tone: "border-emerald-300/50 bg-emerald-300/15 text-emerald-200" },
  scheduled: { label: "Scheduled", tone: "border-sky-300/50 bg-sky-300/15 text-sky-200" },
  expired: { label: "Expired", tone: "border-white/20 bg-white/5 text-white/55" },
  hidden: { label: "Hidden", tone: "border-amber-300/50 bg-amber-300/15 text-amber-200" },
};

export function AnnouncementsPanel({ onChanged }: { onChanged: () => void }) {
  const { data, error, reload } = useAdminData<{ announcements: AdminAnnouncement[] }>("/api/admin/announcements");
  const [editing, setEditing] = React.useState<AdminAnnouncement | "new" | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const close = React.useCallback(() => setEditing(null), []);

  async function run(id: string, call: () => ReturnType<typeof adminApi>, success: string) {
    if (busyId) return;
    setBusyId(id);
    const r = await call();
    setBusyId(null);
    setConfirmId(null);
    if (!r.ok) return setNotice({ type: "error", message: r.data.message ?? "Something went wrong. Please try again." });
    setNotice({ type: "success", message: success });
    reload();
    onChanged();
  }

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="Announcements">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Announcements</h2>
          <p className="mt-1 text-sm text-white/60">
            Active announcements pop up once per visit on the home page, up to 5 at a time.
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className="rounded-full px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-[1.03]" style={{ backgroundImage: GOLD_GRADIENT }}>
          New announcement
        </button>
      </div>

      {notice && (
        <p role={notice.type === "error" ? "alert" : "status"} className={cn("mt-4 rounded-xl border px-4 py-2.5 text-sm", notice.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200")}>
          {notice.message}
        </p>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

      {!data ? (
        <div className="mt-5 space-y-2" aria-hidden>
          {[0, 1].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      ) : data.announcements.length === 0 ? (
        <p className="px-2 py-10 text-center text-sm text-white/55">No announcements yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10">
          {data.announcements.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-x-5 gap-y-3 py-4">
              <div className="flex min-w-[15rem] flex-1 items-center gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5">
                  {a.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.image} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-white/35">No image</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{a.title}</p>
                  <p className="mt-0.5 text-xs text-white/55">{formatSpan(a.startDate, a.endDate)}</p>
                </div>
              </div>
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", STATE[a.state].tone)}>{STATE[a.state].label}</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditing(a)} className={cn(BTN, "border-white/25 text-white/85 hover:border-white/45")}>
                  Edit
                </button>
                <button
                  type="button"
                  disabled={busyId === a.id}
                  onClick={() =>
                    run(a.id, () => adminApi(`/api/admin/announcements/${a.id}`, { method: "PATCH", body: { published: !a.published } }), a.published ? "Announcement hidden." : "Announcement is visible again.")
                  }
                  className={cn(BTN, "border-white/25 text-white/85 hover:border-white/45")}
                >
                  {a.published ? "Hide" : "Show"}
                </button>
                {confirmId === a.id ? (
                  <>
                    <button type="button" disabled={busyId === a.id} onClick={() => run(a.id, () => adminApi(`/api/admin/announcements/${a.id}`, { method: "DELETE" }), "Announcement deleted.")} className={cn(BTN, "border-transparent bg-red-500/90 text-white hover:bg-red-500")}>
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className={cn(BTN, "border-white/20 text-white/80 hover:border-white/40")}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setConfirmId(a.id)} className={cn(BTN, "border-red-300/40 text-red-200 hover:bg-red-400/10")}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <AnnouncementFormModal
          announcement={editing === "new" ? undefined : editing}
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