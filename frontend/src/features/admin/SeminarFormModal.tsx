"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { SeminarRow } from "@/lib/admin-engagement";
import { isSaturdayDate } from "@/lib/dates";
import { GOLD_GRADIENT } from "@/lib/theme";

import { FormActions, FormField, ModalShell, inputClass } from "./form-bits";

type Errors = Partial<Record<"date" | "startTime" | "venue" | "note", string>>;

export function SeminarFormModal({
  seminar,
  initialDate,
  onClose,
  onSaved,
}: {
  seminar?: SeminarRow;
  initialDate?: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = React.useId();
  const editing = !!seminar;
  const [v, setV] = React.useState({
    date: seminar?.date ?? initialDate ?? "",
    startTime: seminar?.startTime ?? "8:00 AM",
    venue: seminar?.venue ?? "",
    note: seminar?.note ?? "",
    status: seminar?.status ?? ("open" as "open" | "closed"),
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const set = (k: keyof Errors) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };
  const attrs = (k: keyof Errors) => ({
    id: `${uid}-${k}`,
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
    className: inputClass(errors[k]),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const found: Errors = {};
    if (!v.date) found.date = "Choose a date.";
    else if (!isSaturdayDate(v.date)) found.date = "Seminars are held on Saturdays only.";
    if (v.startTime.length > 30) found.startTime = "Too long.";
    if (v.venue.length > 160) found.venue = "Too long.";
    if (v.note.length > 300) found.note = "Keep the note under 300 characters.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFormError("");
    const body = { date: v.date, startTime: v.startTime.trim(), venue: v.venue.trim(), note: v.note.trim(), status: v.status };
    const r = editing
      ? await adminApi(`/api/admin/seminars/${seminar.id}`, { method: "PATCH", body })
      : await adminApi("/api/admin/seminars", { method: "POST", body });
    setBusy(false);

    if (r.ok) return onSaved(editing ? "Seminar updated." : "Seminar scheduled.");
    if (r.data.errors) {
      const mapped: Errors = {};
      for (const [k, msg] of Object.entries(r.data.errors)) if (k in found || k in v) mapped[k as keyof Errors] = msg;
      setErrors(mapped);
      if (Object.keys(mapped).length > 0) return;
    }
    setFormError(r.data.message ?? "We couldn't save the seminar. Please try again.");
  }

  return (
    <ModalShell title={editing ? "Edit seminar" : "Schedule a seminar"} subtitle="PMES seminars are held on Saturdays." onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField id={`${uid}-date`} label="Date (Saturday)" error={errors.date}>
          <input {...attrs("date")} type="date" value={v.date} onChange={set("date")} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${uid}-startTime`} label="Start time" optional error={errors.startTime}>
            <input {...attrs("startTime")} value={v.startTime} onChange={set("startTime")} maxLength={30} placeholder="8:00 AM" />
          </FormField>
          <FormField id={`${uid}-venue`} label="Venue" optional error={errors.venue}>
            <input {...attrs("venue")} value={v.venue} onChange={set("venue")} maxLength={160} placeholder="PRIC-MPC Office, Dolores" />
          </FormField>
        </div>
        <FormField id={`${uid}-note`} label="Note for applicants" optional error={errors.note}>
          <textarea {...attrs("note")} value={v.note} onChange={set("note")} rows={2} maxLength={300} placeholder="e.g. Bring a valid ID and a pen." />
        </FormField>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-white">Registration</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {(["open", "closed"] as const).map((s) => (
              <label key={s} className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-center text-sm font-medium capitalize transition-colors has-[:checked]:border-[#efc673] has-[:checked]:bg-[#efc673]/15 has-[:checked]:text-[#f4d587] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#efc673]/60">
                <input type="radio" name={`${uid}-status`} checked={v.status === s} onChange={() => setV((p) => ({ ...p, status: s }))} className="sr-only" />
                {s === "open" ? "Open for applicants" : "Closed (full)"}
              </label>
            ))}
          </div>
        </fieldset>

        <div aria-live="polite" className="min-h-5">
          {formError && <p role="alert" className="text-sm text-red-300">{formError}</p>}
        </div>
        <FormActions busy={busy} submitLabel={editing ? "Save changes" : "Schedule seminar"} onCancel={onClose} gold={GOLD_GRADIENT} />
      </form>
    </ModalShell>
  );
}