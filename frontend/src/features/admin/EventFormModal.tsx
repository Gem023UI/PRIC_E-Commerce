"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { AdminEvent } from "@/lib/admin-engagement";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { FormActions, FormField, ModalShell, inputClass } from "./form-bits";
import { ImageUploadField } from "./ImageUploadField";

type Field = "title" | "location" | "dateLabel" | "sortDate" | "time" | "description" | "images";
type Errors = Partial<Record<Field, string>>;

const IMAGE_RE = /^(https:\/\/[^\s"'<>]+|\/[A-Za-z0-9\-._~%/]+)$/;
const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

export function EventFormModal({
  event,
  onClose,
  onSaved,
}: {
  event?: AdminEvent;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = React.useId();
  const editing = !!event;
  const [v, setV] = React.useState({
    title: event?.title ?? "",
    location: event?.location ?? "",
    dateLabel: event?.dateLabel ?? "",
    sortDate: event?.sortDate ?? "",
    time: event?.time === "Time not specified" ? "" : (event?.time ?? ""),
    description: event?.description ?? "",
    status: event?.status ?? ("upcoming" as "upcoming" | "latest"),
  });
  const [images, setImages] = React.useState<string[]>(event?.images ?? []);
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
    const location = clean(v.location);
    const dateLabel = clean(v.dateLabel);
    const description = clean(v.description);
    const pics = images.map((s) => s.trim()).filter(Boolean);

    const found: Errors = {};
    if (title.length < 3) found.title = "Title is required.";
    if (location.length < 2) found.location = "Location is required.";
    if (dateLabel.length < 2) found.dateLabel = "Enter the date as it should appear.";
    if (description.length < 10) found.description = "Add a short description (at least 10 characters).";
    if (pics.some((p) => !IMAGE_RE.test(p))) found.images = "Every picture needs an https:// link.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFormError("");
    const body = { title, location, dateLabel, sortDate: v.sortDate, time: clean(v.time), description, images: pics, status: v.status };
    const r = editing
      ? await adminApi(`/api/admin/events/${event.id}`, { method: "PATCH", body })
      : await adminApi("/api/admin/events", { method: "POST", body });
    setBusy(false);

    if (r.ok) return onSaved(editing ? `${title} was updated.` : `${title} was added.`);
    if (r.data.errors) {
      const mapped: Errors = {};
      for (const [k, msg] of Object.entries(r.data.errors)) if (k in v || k === "images") mapped[k as Field] = msg;
      setErrors(mapped);
      if (Object.keys(mapped).length > 0) return;
    }
    setFormError(r.data.message ?? "We couldn't save the event. Please try again.");
  }

  return (
    <ModalShell title={editing ? "Edit event" : "Add event"} wide onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-white">Where should it appear?</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {(["upcoming", "latest"] as const).map((s) => (
              <label key={s} className="cursor-pointer rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-center text-sm font-medium transition-colors has-[:checked]:border-[#efc673] has-[:checked]:bg-[#efc673]/15 has-[:checked]:text-[#f4d587] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#efc673]/60">
                <input type="radio" name={`${uid}-status`} checked={v.status === s} onChange={() => setV((p) => ({ ...p, status: s }))} className="sr-only" />
                {s === "upcoming" ? "Upcoming events" : "Latest (past) events"}
              </label>
            ))}
          </div>
        </fieldset>

        <FormField id={`${uid}-title`} label="Title" error={errors.title}>
          <input {...attrs("title")} value={v.title} onChange={set("title")} maxLength={200} autoComplete="off" />
        </FormField>

        <FormField id={`${uid}-location`} label="Location" error={errors.location}>
          <input {...attrs("location")} value={v.location} onChange={set("location")} maxLength={200} autoComplete="off" />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id={`${uid}-dateLabel`} label="Date shown" hint="Exactly as visitors should read it, e.g. December 12–14, 2026" error={errors.dateLabel}>
            <input {...attrs("dateLabel")} value={v.dateLabel} onChange={set("dateLabel")} maxLength={80} autoComplete="off" />
          </FormField>
          <FormField id={`${uid}-sortDate`} label="Sort date" optional hint="Used only to order events" error={errors.sortDate}>
            <input {...attrs("sortDate")} type="date" value={v.sortDate} onChange={set("sortDate")} />
          </FormField>
        </div>

        <FormField id={`${uid}-time`} label="Time" optional error={errors.time}>
          <input {...attrs("time")} value={v.time} onChange={set("time")} maxLength={60} placeholder="e.g. 10:00 AM – 8:00 PM" autoComplete="off" />
        </FormField>

        <FormField id={`${uid}-description`} label="Description" error={errors.description}>
          <textarea {...attrs("description")} value={v.description} onChange={set("description")} rows={5} maxLength={5000} />
        </FormField>

        <div>
          <p className="mb-1.5 text-sm font-medium text-white">
            Pictures <span className="text-white/50">(optional, up to 6)</span>
          </p>
          <div className="space-y-3">
            {images.map((src, i) => (
              <ImageUploadField
                key={i}
                id={`${uid}-img-${i}`}
                folder="events"
                value={src}
                onChange={(url) => {
                  setImages((list) => list.map((x, j) => (j === i ? url : x)));
                  setErrors((p) => ({ ...p, images: undefined }));
                }}
                onRemove={() => setImages((list) => list.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          {images.length < 6 && (
            <button
              type="button"
              onClick={() => setImages((list) => [...list, ""])}
              className={cn("rounded-full border border-white/25 px-4 py-1.5 text-sm text-white/85 hover:border-white/45", images.length > 0 && "mt-3")}
            >
              Add a picture
            </button>
          )}
          {errors.images && <p role="alert" className="mt-1.5 text-sm text-red-300">{errors.images}</p>}
          {images.length === 0 && <p className="mt-1.5 text-xs text-white/50">Without a picture, a default photo is shown.</p>}
        </div>

        <div aria-live="polite" className="min-h-5">
          {formError && <p role="alert" className="text-sm text-red-300">{formError}</p>}
        </div>
        <FormActions busy={busy} submitLabel={editing ? "Save changes" : "Add event"} onCancel={onClose} gold={GOLD_GRADIENT} />
      </form>
    </ModalShell>
  );
}