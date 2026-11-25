"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { SeminarList, SeminarRow } from "@/lib/admin-engagement";
import { formatInt } from "@/lib/admin-stats";
import { formatLongDate } from "@/lib/dates";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { SeminarFormModal } from "./SeminarFormModal";
import { CARD } from "./ui";
import { useAdminData } from "./use-admin-data";

const BTN = "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

function SeminarItem({
  s,
  past,
  busy,
  confirming,
  onViewApplicants,
  onEdit,
  onAskDelete,
  onDelete,
  onCancelDelete,
}: {
  s: SeminarRow;
  past?: boolean;
  busy: boolean;
  confirming: boolean;
  onViewApplicants: (date: string) => void;
  onEdit: (s: SeminarRow) => void;
  onAskDelete: () => void;
  onDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3.5">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white">
          {formatLongDate(s.date)}
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
              s.status === "open" ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-200" : "border-white/20 bg-white/5 text-white/60",
            )}
          >
            {s.status === "open" ? "Open" : "Closed"}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-white/55">
          {[s.startTime, s.venue].filter(Boolean).join(" · ") || "No venue set"}
          {s.note && ` · ${s.note}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => onViewApplicants(s.date)} className={cn(BTN, "border-[#c8933a] text-[#f4d587] hover:bg-[#c8933a]/15")}>
          {formatInt(s.applicants)} {s.applicants === 1 ? "applicant" : "applicants"}
        </button>
        {!past && (
          <button type="button" onClick={() => onEdit(s)} className={cn(BTN, "border-white/25 text-white/85 hover:border-white/45")}>
            Edit
          </button>
        )}
        {confirming ? (
          <>
            <button type="button" disabled={busy} onClick={onDelete} className={cn(BTN, "border-transparent bg-red-500/90 text-white hover:bg-red-500")}>
              Yes, delete
            </button>
            <button type="button" onClick={onCancelDelete} className={cn(BTN, "border-white/20 text-white/80 hover:border-white/40")}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" onClick={onAskDelete} className={cn(BTN, "border-red-300/40 text-red-200 hover:bg-red-400/10")}>
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

export function SeminarsPanel({
  onViewApplicants,
  onChanged,
}: {
  onViewApplicants: (date: string) => void;
  onChanged: () => void;
}) {
  const { data, error, reload } = useAdminData<SeminarList>("/api/admin/seminars");
  const [editing, setEditing] = React.useState<{ seminar?: SeminarRow; date?: string } | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ type: "success" | "error"; message: string } | null>(null);
  const close = React.useCallback(() => setEditing(null), []);

  async function remove(s: SeminarRow) {
    setBusyId(s.id);
    const r = await adminApi(`/api/admin/seminars/${s.id}`, { method: "DELETE" });
    setBusyId(null);
    setConfirmId(null);
    if (!r.ok) return setNotice({ type: "error", message: r.data.message ?? "We couldn't delete that seminar." });
    setNotice({ type: "success", message: "Seminar deleted." });
    reload();
    onChanged();
  }

  const item = (s: SeminarRow, past?: boolean) => (
    <SeminarItem
      key={s.id}
      s={s}
      past={past}
      busy={busyId === s.id}
      confirming={confirmId === s.id}
      onViewApplicants={onViewApplicants}
      onEdit={(x) => setEditing({ seminar: x })}
      onAskDelete={() => setConfirmId(s.id)}
      onDelete={() => remove(s)}
      onCancelDelete={() => setConfirmId(null)}
    />
  );

  return (
    <section className={cn(CARD, "p-5 md:p-6")} aria-label="PMES seminars">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">PMES seminar schedule</h2>
          <p className="mt-1 text-sm text-white/60">
            Seminars are held on Saturdays. The earliest open date is shown on the membership page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({})}
          className="rounded-full px-4 py-2 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
          style={{ backgroundImage: GOLD_GRADIENT }}
        >
          Schedule a seminar
        </button>
      </div>

      {notice && (
        <p role={notice.type === "error" ? "alert" : "status"} className={cn("mt-4 rounded-xl border px-4 py-2.5 text-sm", notice.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200")}>
          {notice.message}
        </p>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}

      {!data ? (
        <div className="mt-5 h-20 animate-pulse rounded-xl bg-white/5" aria-hidden />
      ) : (
        <>
          {data.upcoming.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/60">
              No upcoming seminars. Until you schedule one, applicants pick from the next four Saturdays.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-white/10">{data.upcoming.map((s) => item(s))}</ul>
          )}

          {data.requestedDates.length > 0 && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white">Saturdays applicants asked for</h3>
              <p className="mt-0.5 text-xs text-white/55">No seminar is scheduled on these dates yet.</p>
              <ul className="mt-3 space-y-2">
                {data.requestedDates.map((d) => (
                  <li key={d.date} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-white/85">
                      {formatLongDate(d.date)} <span className="text-white/50">· {formatInt(d.applicants)} requested</span>
                    </span>
                    <button type="button" onClick={() => setEditing({ date: d.date })} className={cn(BTN, "border-[#c8933a] text-[#f4d587] hover:bg-[#c8933a]/15")}>
                      Schedule
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.past.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer select-none text-sm font-medium text-white/70 marker:text-white/40">
                Past seminars ({data.past.length})
              </summary>
              <ul className="mt-2 divide-y divide-white/10">{data.past.map((s) => item(s, true))}</ul>
            </details>
          )}
        </>
      )}

      {editing && (
        <SeminarFormModal
          seminar={editing.seminar}
          initialDate={editing.date}
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