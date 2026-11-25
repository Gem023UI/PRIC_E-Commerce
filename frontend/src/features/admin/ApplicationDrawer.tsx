"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationDetail,
  type ApplicationStatus,
} from "@/lib/admin-engagement";
import { formatDateTime } from "@/lib/admin-orders";
import { formatLongDate, formatShortDate } from "@/lib/dates";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { ApplicationStatusBadge } from "./badges";
import { CloseIcon } from "./icons";

const STATUSES: ApplicationStatus[] = ["new", "under_review", "approved", "rejected"];

function Rows({ items }: { items: [string, string | undefined | null][] }) {
  const shown = items.filter(([, v]) => v && String(v).trim());
  if (shown.length === 0) return <p className="text-sm text-white/45">Nothing provided.</p>;
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {shown.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-widest text-white/45">{k}</dt>
          <dd className="mt-0.5 break-words text-white/90">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-7">
    <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>
    {children}
  </section>
);

export function ApplicationDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const [a, setA] = React.useState<ApplicationDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [next, setNext] = React.useState<ApplicationStatus>("new");
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const apply = React.useCallback((d: ApplicationDetail) => {
    setA(d);
    setNext(d.status);
    setNote(d.statusNote);
  }, []);

  React.useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const r = await adminApi<{ application: ApplicationDetail }>(`/api/admin/applications/${id}`, { signal: ctrl.signal });
        if (r.ok && r.data.application) apply(r.data.application);
        else setError(r.status === 404 ? "This application could not be found." : "We couldn't load this application.");
      } catch {
        /* aborted */
      }
    })();
    return () => ctrl.abort();
  }, [id, apply]);

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

  async function save() {
    if (!a || busy) return;
    setBusy(true);
    setFeedback(null);
    const r = await adminApi<{ application: ApplicationDetail }>(`/api/admin/applications/${a.id}/status`, {
      method: "PATCH",
      body: { status: next, ...(note.trim() ? { note: note.trim() } : {}) },
    });
    setBusy(false);
    if (!r.ok || !r.data.application) {
      setFeedback({ type: "error", message: r.data.errors?.note ?? r.data.message ?? "We couldn't save the status." });
      return;
    }
    apply(r.data.application);
    setFeedback({ type: "success", message: `Marked as ${APPLICATION_STATUS_LABELS[next].toLowerCase()}.` });
    onChanged();
  }

  const fullName = a ? [a.firstName, a.middleName, a.lastName].filter(Boolean).join(" ") : "";
  const dirty = !!a && (next !== a.status || note.trim() !== a.statusNote);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden />
      <aside role="dialog" aria-modal="true" aria-label="Membership application" className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div className="min-w-0">
            {a ? (
              <>
                <h2 className="truncate text-xl font-bold text-white">{fullName}</h2>
                <p className="mt-0.5 text-sm text-white/55">
                  <span className="font-mono text-[#f4d587]">{a.reference}</span> · submitted {formatDateTime(a.createdAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <ApplicationStatusBadge status={a.status} />
                  <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white/75">{a.membershipCategory}</span>
                </div>
              </>
            ) : (
              <div className="space-y-2" aria-hidden>
                <div className="h-6 w-56 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
              </div>
            )}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 hover:border-white/30 hover:text-white">
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-1">
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

          {a && (
            <>
              <Section title="Decision">
                <div role="radiogroup" aria-label="Application status" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {STATUSES.map((s) => (
                    <label key={s} className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-2 py-2.5 text-center text-xs font-semibold transition-colors has-[:checked]:border-[#efc673] has-[:checked]:bg-[#efc673]/15 has-[:checked]:text-[#f4d587] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#efc673]/60">
                      <input type="radio" name="app-status" checked={next === s} onChange={() => setNext(s)} className="sr-only" />
                      {APPLICATION_STATUS_LABELS[s]}
                    </label>
                  ))}
                </div>
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-sm font-medium text-white">
                    Note <span className="text-white/50">(optional, internal)</span>
                  </span>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={300} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/50" />
                </label>
                {feedback && (
                  <p role={feedback.type === "error" ? "alert" : "status"} className={cn("mt-3 rounded-xl border px-4 py-2.5 text-sm", feedback.type === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200")}>
                    {feedback.message}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-white/45">
                    {a.statusUpdatedAt ? `Last updated ${formatDateTime(a.statusUpdatedAt)}${a.reviewedBy ? ` by ${a.reviewedBy}` : ""}` : "Not reviewed yet"}
                  </p>
                  <button type="button" onClick={save} disabled={!dirty || busy} className="rounded-full px-5 py-2 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundImage: GOLD_GRADIENT }}>
                    {busy ? "Saving…" : "Save decision"}
                  </button>
                </div>
              </Section>

              <Section title="PMES seminar">
                <Rows items={[["Chosen date", formatLongDate(a.scheduleDate)]]} />
              </Section>

              <Section title="Personal information">
                <Rows
                  items={[
                    ["Phone", a.phone],
                    ["Address", a.address],
                    ["Birth date", formatShortDate(a.birthDate)],
                    ["Place of birth", a.birthPlace],
                    ["Civil status", a.civilStatus],
                    ["Sex", a.sex],
                    ["Nationality", a.nationality],
                    ["Religion", a.religion],
                    ["Weight", a.weight],
                    ["Height", a.height],
                    ["Occupation / workplace", a.occupation],
                  ]}
                />
              </Section>

              <Section title="Family">
                <Rows
                  items={[
                    ["Mother", a.motherName],
                    ["Mother's occupation", a.motherOccupation],
                    ["Father", a.fatherName],
                    ["Father's occupation", a.fatherOccupation],
                    ["Spouse", a.spouseName],
                    ["Spouse's occupation", a.spouseOccupation],
                  ]}
                />
              </Section>

              <Section title="Beneficiaries">
                {a.beneficiaries.length === 0 ? (
                  <p className="text-sm text-white/45">None listed.</p>
                ) : (
                  <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
                    {a.beneficiaries.map((b, i) => (
                      <li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                        <span className="text-white/90">{b.name}</span>
                        <span className="text-xs text-white/55">
                          {b.relationship} · born {formatShortDate(b.birthDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>

              <Section title="Education">
                <Rows
                  items={(["college", "vocational", "secondary", "elementary"] as const).map((k) => [
                    k.charAt(0).toUpperCase() + k.slice(1),
                    a.education[k].school ? `${a.education[k].school}${a.education[k].year ? ` (${a.education[k].year})` : ""}` : "",
                  ])}
                />
              </Section>

              <Section title="Identification">
                <Rows
                  items={[
                    ["TIN", a.ids.tin],
                    ["Pag-IBIG", a.ids.pagibig],
                    ["SSS", a.ids.sss],
                    ["PhilHealth", a.ids.philhealth],
                    ["Senior ID", a.ids.seniorId],
                    ["National ID", a.ids.nationalId],
                    ["Other", a.ids.other],
                  ]}
                />
              </Section>

              <Section title="Signature">
                <p className="text-sm text-white/90">{a.signatureName}</p>
                {a.signatureImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.signatureImage} alt={`Signature of ${fullName}`} className="mt-3 w-full max-w-sm rounded-lg border border-white/15 bg-white" />
                ) : (
                  <p className="mt-1 text-xs text-white/45">No drawn signature.</p>
                )}
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}