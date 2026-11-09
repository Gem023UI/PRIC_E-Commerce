"use client";

import { useId, useRef, useState } from "react";

import EmailOtpModal from "@/components/ui/EmailOtpModal";
import type { ServiceId } from "@/data/services";
import { cn } from "@/lib/utils";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

type Props = {
  /** Set automatically by the service section the form was opened from. */
  service: ServiceId;
  title: string;
  submitLabel: string;
  notice: string;
  messagePlaceholder?: string;
  onOtpActiveChange?: (active: boolean) => void;
  onClose?: () => void;
};

type Values = { fullName: string; email: string; phone: string; message: string };
type Field = keyof Values;
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "submitting" | "success" | "error";
type ApiResult = {
  ok: boolean;
  status: number;
  data: { message?: string; errors?: Record<string, string>; verificationToken?: string };
};

/* ---------- Sanitization + validation (the server repeats all of this) ---------- */

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{1,79}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE = /^09\d{9}$/;

/* eslint-disable no-control-regex */
const stripControl = (s: string) =>
  s.normalize("NFKC").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
/* eslint-enable no-control-regex */

const oneLine = (s: string) =>
  stripControl(s).replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

const multiLine = (s: string) =>
  stripControl(s)
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const toEmail = (s: string) => oneLine(s).toLowerCase();
const toPhone = (s: string) =>
  oneLine(s)
    .replace(/[\s().-]/g, "")
    .replace(/^\+?63(?=9\d{9}$)/, "0");

function sanitize(v: Values): Values {
  return {
    fullName: oneLine(v.fullName),
    email: toEmail(v.email),
    phone: toPhone(v.phone),
    message: multiLine(v.message),
  };
}

function validate(name: Field, v: Values): string | undefined {
  const value = v[name];
  switch (name) {
    case "fullName":
      if (!value) return "Full name is required.";
      if (!NAME_RE.test(value)) return "Enter your full name using letters only.";
      break;
    case "email":
      if (!value) return "Email is required.";
      if (value.length > 254 || !EMAIL_RE.test(value)) return "Enter a valid email address.";
      break;
    case "phone":
      if (!value) return "Phone number is required.";
      if (!PH_MOBILE.test(value)) return "Enter a valid Philippine mobile number.";
      break;
    case "message":
      if (!value) return "Please tell us about your inquiry.";
      if (value.length < 10) return "Please provide at least 10 characters.";
      if (value.length > 1000) return "Keep your message under 1,000 characters.";
      break;
  }
  return undefined;
}

async function post(path: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Network error. Please check your connection and try again." },
    };
  }
}

/* ---------- Component ---------- */

export default function InquiryForm({
  service,
  title,
  submitLabel,
  notice,
  messagePlaceholder,
  onOtpActiveChange,
  onClose,
}: Props) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);

  const [values, setValues] = useState<Values>({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState("");

  const [verification, setVerification] = useState<{ email: string; token: string } | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const otpOpen = otpEmail !== null;

  const isVerified = !!verification && verification.email === toEmail(values.email);

  const setOtp = (email: string | null) => {
    setOtpEmail(email);
    onOtpActiveChange?.(email !== null);
  };

  const onChange =
    (name: Field) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setValues((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      if (name === "email" && verification && toEmail(value) !== verification.email) {
        setVerification(null);
      }
    };

  const requestOtp = async (email: string): Promise<string | null> => {
    const r = await post("/api/inquiries/otp", { email });
    if (r.ok) return null;
    return r.data.errors?.email ?? r.data.message ?? "We couldn't send the code. Please try again.";
  };

  async function handleVerifyClick() {
    if (isVerified || sendingOtp) return;
    const email = toEmail(values.email);
    const err = validate("email", { ...values, email });
    if (err) {
      setErrors((prev) => ({ ...prev, email: err }));
      return;
    }
    setSendingOtp(true);
    const failure = await requestOtp(email);
    setSendingOtp(false);
    if (failure) {
      setErrors((prev) => ({ ...prev, email: failure }));
      return;
    }
    setOtp(email);
  }

  async function handleVerifyCode(code: string): Promise<string | null> {
    if (!otpEmail) return "Something went wrong. Please try again.";
    const r = await post("/api/inquiries/otp/verify", { email: otpEmail, code });
    if (!r.ok || !r.data.verificationToken) {
      return r.data.errors?.code ?? r.data.message ?? "Verification failed. Please try again.";
    }
    setVerification({ email: otpEmail, token: r.data.verificationToken });
    setErrors((prev) => ({ ...prev, email: undefined }));
    setOtp(null);
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const clean = sanitize(values);
    setValues(clean);

    const found: Errors = {};
    (Object.keys(clean) as Field[]).forEach((k) => {
      const msg = validate(k, clean);
      if (msg) found[k] = msg;
    });
    if (!found.email && !(verification && verification.email === clean.email)) {
      found.email = "Verify your email before submitting.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("idle");
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }

    setStatus("submitting");
    setServerError("");
    const r = await post("/api/inquiries", {
      service,
      ...clean,
      verificationToken: verification?.token ?? "",
    });

    if (r.ok) {
      setStatus("success");
      return;
    }
    if (r.status === 401) {
      setVerification(null);
      setErrors({
        email: r.data.message ?? "Verification expired. Please verify your email again.",
      });
      setStatus("idle");
      return;
    }
    if (r.status === 400 && r.data.errors) {
      const mapped: Errors = {};
      for (const [k, msg] of Object.entries(r.data.errors)) {
        const key = k === "verificationToken" ? "email" : k;
        if (key in clean) mapped[key as Field] = msg;
      }
      setErrors(mapped);
      setStatus("idle");
      return;
    }
    setServerError(r.data.message ?? "We couldn't send your inquiry. Please try again.");
    setStatus("error");
  }

  const inputClass = (name: Field) =>
    cn(
      "w-full min-h-12 rounded-xl border bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none transition-colors focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60",
      errors[name] ? "border-red-400" : "border-white/20",
    );

  const fieldProps = (name: Field) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: onChange(name),
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-error` : undefined,
    className: inputClass(name),
  });

  const label = (name: Field, text: string) => (
    <label htmlFor={`${uid}-${name}`} className="mb-2 block text-sm font-medium text-white">
      {text}
      <span aria-hidden="true" className="text-[#efc673]">
        {" "}
        *
      </span>
    </label>
  );

  const error = (name: Field) =>
    errors[name] ? (
      <p id={`${uid}-${name}-error`} className="mt-2 text-sm text-red-300">
        {errors[name]}
      </p>
    ) : null;

  const closeButton = onClose ? (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close inquiry form"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors hover:border-[#efc673] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  ) : null;

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[#c8933a]/40 bg-[#0a0a0a] p-6 md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-xl font-semibold text-[#f4d587]">Inquiry received</h4>
          {closeButton}
        </div>
        <p className="mt-3 text-base leading-relaxed text-white/80">
          Thank you. PRIC MPC will review your inquiry and get back to you using
          the contact details you provided. This is an inquiry only, not a
          confirmed booking, application, or approved transaction.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-12 rounded-xl border border-white/30 px-5 text-base font-medium text-white transition-colors hover:border-[#efc673] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        aria-label={title}
        aria-hidden={otpOpen}
        inert={otpOpen}
        className={cn(
          "rounded-2xl border border-white/15 bg-[#0a0a0a] p-6 transition-opacity duration-300 md:p-8",
          otpOpen ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h4 className="text-xl font-semibold text-[#f4d587]">{title}</h4>
          {closeButton}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{notice}</p>

        <div className="mt-6 space-y-5">
          <div>
            {label("fullName", "Full name")}
            <input {...fieldProps("fullName")} type="text" autoComplete="name" maxLength={80} />
            {error("fullName")}
          </div>

          <div>
            {label("email", "Email")}
            <div className="flex gap-3">
              <input
                {...fieldProps("email")}
                type="email"
                autoComplete="email"
                maxLength={254}
                className={cn(inputClass("email"), "min-w-0 flex-1")}
              />
              <button
                type="button"
                onClick={handleVerifyClick}
                disabled={isVerified || sendingOtp}
                className={cn(
                  "inline-flex min-h-12 min-w-[7.5rem] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673] disabled:cursor-not-allowed",
                  isVerified
                    ? "border-emerald-400/60 text-emerald-300"
                    : "border-[#c8933a] text-[#f4d587] hover:bg-[#c8933a]/15 disabled:opacity-70",
                )}
              >
                {isVerified ? (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                    Verified
                  </>
                ) : sendingOtp ? (
                  "Sending..."
                ) : (
                  "Verify"
                )}
              </button>
            </div>
            <span role="status" className="sr-only">
              {isVerified ? "Email verified" : ""}
            </span>
            {error("email")}
          </div>

          <div>
            {label("phone", "Phone number")}
            <input
              {...fieldProps("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="09XX XXX XXXX"
              maxLength={20}
            />
            {error("phone")}
          </div>

          <div>
            {label("message", "Inquiry details")}
            <textarea
              {...fieldProps("message")}
              rows={5}
              maxLength={1000}
              placeholder={messagePlaceholder}
            />
            {error("message")}
          </div>
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

      {otpEmail ? (
        <EmailOtpModal
          email={otpEmail}
          onClose={() => setOtp(null)}
          onVerify={handleVerifyCode}
          onResend={() => requestOtp(otpEmail)}
        />
      ) : null}
    </>
  );
}