"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { AdminAnnouncement } from "@/lib/admin-engagement";
import { GOLD_GRADIENT } from "@/lib/theme";

import { FormActions, FormField, ModalShell, inputClass } from "./form-bits";
import { ImageUploadField } from "./ImageUploadField";

type Field = "title" | "description" | "image" | "startDate" | "endDate";
type Errors = Partial<Record<Field, string>>;

const IMAGE_RE = /^(https:\/\/[^\s"'<>]+|\/[A-Za-z0-9\-._~%/]+)$/;
const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

/** Today's date in Philippine time, for the default span. */
const manilaToday = () => new Date(Date.now() + 8 * 3_600_000).toISOString().slice(0, 10);

export function AnnouncementFormModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement?: AdminAnnouncement;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = React.useId();
  const editing = !!announcement;
  const [v, setV] = React.useState({
    title: announcement?.title ?? "",
    description: announcement?.description ?? "",
    image: announcement?.image ?? "",
    startDate: announcement?.startDate ?? manilaToday(),
    endDate: announcement?.endDate ?? "",
    published: announcement?.published ?? true,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const set = (k: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };
  const attrs = (k: Field) => ({
    id: `${uid}-${k}`,
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
    className: inputClass(errors[k]),
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const title = clean(v.title);
    const description = v.description.replace(/[<>]/g, "").trim();
    const image = v.image.trim();

    const found: Errors = {};
    if (title.length < 2) found.title = "Title is required.";
    if (description.length > 1000) found.description = "Keep the description under 1,000 characters.";
    if (image && !IMAGE_RE.test(image)) found.image = "Use an https:// image link or a /path from the site.";
    if (!v.startDate) found.startDate = "Choose a start date.";
    if (!v.endDate) found.endDate = "Choose an end date.";
    else if (v.startDate && v.endDate < v.startDate) found.endDate = "The end date can't be before the start date.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFormError("");
    const body = { title, description, image, startDate: v.startDate, endDate: v.endDate, published: v.published };
    const r = editing
      ? await adminApi(`/api/admin/announcements/${announcement.id}`, { method: "PATCH", body })
      : await adminApi("/api/admin/announcements", { method: "POST", body });
    setBusy(false);

    if (r.ok) return onSaved(editing ? "Announcement updated." : "Announcement created.");
    if (r.data.errors) {
      const mapped: Errors = {};
      for (const [k, msg] of Object.entries(r.data.errors)) if (k in v) mapped[k as Field] = msg;
      setErrors(mapped);
      if (Object.keys(mapped).length > 0) return;
    }
    setFormError(r.data.message ?? "We couldn't save the announcement. Please try again.");
  }

  return (
    <ModalShell
      title={editing ? "Edit announcement" : "New announcement"}
      subtitle="Visitors see active announcements in a pop-up on the home page."
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormField id={`${uid}-title`} label="Title" error={errors.title}>
          <input {...attrs("title")} value={v.title} onChange={set("title")} maxLength={120} autoComplete="off" />
        </FormField>

        <FormField id={`${uid}-description`} label="Description" optional error={errors.description}>
          <textarea {...attrs("description")} value={v.description} onChange={set("description")} rows={4} maxLength={1000} />
        </FormField>

        <div>
          <p className="mb-1.5 text-sm font-medium text-white">
            Image <span className="text-white/50">(optional)</span>
          </p>
          <ImageUploadField
            id={`${uid}-image`}
            folder="announcements"
            value={v.image}
            error={errors.image}
            onChange={(url) => {
              setV((p) => ({ ...p, image: url }));
              setErrors((p) => ({ ...p, image: undefined }));
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${uid}-startDate`} label="Shown from" error={errors.startDate}>
            <input {...attrs("startDate")} type="date" value={v.startDate} onChange={set("startDate")} />
          </FormField>
          <FormField id={`${uid}-endDate`} label="Shown until (inclusive)" error={errors.endDate}>
            <input {...attrs("endDate")} type="date" value={v.endDate} min={v.startDate} onChange={set("endDate")} />
          </FormField>
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
          <input
            type="checkbox"
            checked={v.published}
            onChange={(e) => setV((p) => ({ ...p, published: e.target.checked }))}
            className="mt-0.5 size-5 shrink-0 accent-[#efc673]"
          />
          <span>
            Visible on the website
            <span className="block text-xs text-white/50">Untick to keep it as a draft. It only shows between the dates above.</span>
          </span>
        </label>

        <div aria-live="polite" className="min-h-5">
          {formError && <p role="alert" className="text-sm text-red-300">{formError}</p>}
        </div>
        <FormActions busy={busy} submitLabel={editing ? "Save changes" : "Create announcement"} onCancel={onClose} gold={GOLD_GRADIENT} />
      </form>
    </ModalShell>
  );
}