"use client";

import { useId, useState } from "react";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

// Points at the Express backend. Adjust the path once the inquiries route exists.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export type InquiryField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "date" | "number" | "select" | "textarea";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  /** Takes the full row on desktop. */
  full?: boolean;
};

type Props = {
  service: string;
  title: string;
  fields: InquiryField[];
  submitLabel: string;
  notice: string;
};

type Status = "idle" | "submitting" | "success" | "error";

// Accepts 09XXXXXXXXX, +639XXXXXXXXX or 639XXXXXXXXX.
const PH_MOBILE = /^(\+?63|0)9\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryForm({
  service,
  title,
  fields,
  submitLabel,
  notice,
}: Props) {
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const validate = (data: Record<string, string>) => {
    const next: Record<string, string> = {};
    for (const f of fields) {
      const value = (data[f.name] ?? "").trim();
      if (f.required && !value) {
        next[f.name] = `${f.label} is required.`;
        continue;
      }
      if (!value) continue;
      if (f.type === "email" && !EMAIL.test(value)) {
        next[f.name] = "Enter a valid email address.";
      }
      if (f.type === "tel" && !PH_MOBILE.test(value.replace(/[\s-]/g, ""))) {
        next[f.name] = "Enter a valid Philippine mobile number.";
      }
      if (f.type === "number" && Number(value) < 1) {
        next[f.name] = "Enter a number greater than 0.";
      }
      if (f.type === "date") {
        const picked = new Date(`${value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (picked < today) next[f.name] = "Choose a date from today onward.";
      }
    }
    return next;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(
      fields.map((f) => [f.name, String(formData.get(f.name) ?? "")]),
    );

    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");
    setServerError("");
    try {
      const res = await fetch(`${API_URL}/api/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, ...data }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch {
      setServerError(
        "We couldn't send your inquiry. Please check your connection and try again.",
      );
      setStatus("error");
    }
  }

  const inputClass =
    "w-full min-h-12 rounded-xl border bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none transition-colors focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60";

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[#c8933a]/40 bg-white/5 p-6 md:p-8"
      >
        <h4 className="text-xl font-semibold text-[#f4d587]">
          Inquiry received
        </h4>
        <p className="mt-3 text-base leading-relaxed text-white/80">
          Thank you. PRIC MPC will review your {service.toLowerCase()} inquiry
          and get back to you using the contact details you provided. This is
          an inquiry only, not a confirmed booking, application, or approved
          transaction.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 min-h-12 rounded-xl border border-white/30 px-5 text-base font-medium text-white transition-colors hover:border-[#efc673] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]"
        >
          Send another inquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={title}
      className="rounded-2xl border border-white/15 bg-white/5 p-6 md:p-8"
    >
      <h4 className="text-xl font-semibold text-[#f4d587]">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{notice}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {fields.map((f) => {
          const id = `${uid}-${f.name}`;
          const errId = `${id}-error`;
          const error = errors[f.name];
          const common = {
            id,
            name: f.name,
            required: f.required,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? errId : undefined,
            className: `${inputClass} ${error ? "border-red-400" : "border-white/20"}`,
          };
          return (
            <div
              key={f.name}
              className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}
            >
              <label
                htmlFor={id}
                className="mb-2 block text-sm font-medium text-white"
              >
                {f.label}
                {f.required ? (
                  <span aria-hidden="true" className="text-[#efc673]">
                    {" "}
                    *
                  </span>
                ) : null}
              </label>

              {f.type === "select" ? (
                <select {...common} defaultValue="">
                  <option value="" disabled className="bg-black">
                    Select an option
                  </option>
                  {f.options?.map((o) => (
                    <option key={o} value={o} className="bg-black">
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  {...common}
                  rows={4}
                  placeholder={f.placeholder}
                />
              ) : (
                <input
                  {...common}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  inputMode={
                    f.type === "number"
                      ? "numeric"
                      : f.type === "tel"
                        ? "tel"
                        : undefined
                  }
                  min={f.type === "number" ? 1 : undefined}
                />
              )}

              {error ? (
                <p id={errId} className="mt-2 text-sm text-red-300">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-5 min-h-6">
        {status === "error" ? (
          <p role="alert" className="text-sm text-red-300">
            {serverError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        aria-busy={status === "submitting"}
        className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-xl px-6 text-base font-bold text-black transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        style={{ backgroundImage: GOLD_GRADIENT }}
      >
        {status === "submitting"
          ? "Sending..."
          : status === "error"
            ? "Try again"
            : submitLabel}
      </button>
    </form>
  );
}