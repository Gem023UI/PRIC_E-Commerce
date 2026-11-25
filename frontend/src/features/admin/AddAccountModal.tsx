"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { CloseIcon } from "./icons";

export type CreatedAccount = {
  role: "customer" | "rider";
  email: string;
  inviteEmailSent: boolean;
};

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE = /^(?:\+639|639|09)\d{9}$/;

const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

const INPUT =
  "w-full min-h-11 rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60";

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "mobile" | "role", string>>;

export function AddAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (account: CreatedAccount) => void;
}) {
  const uid = React.useId();
  const firstRef = React.useRef<HTMLInputElement>(null);

  const [values, setValues] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    role: "customer" as "customer" | "rider",
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const firstName = clean(values.firstName);
    const lastName = clean(values.lastName);
    const email = clean(values.email).toLowerCase();
    const mobile = values.mobile.replace(/[\s().-]/g, "");

    const found: Errors = {};
    if (!firstName) found.firstName = "First name is required.";
    else if (!NAME_RE.test(firstName) || firstName.length > 50) found.firstName = "Use letters only (up to 50).";
    if (lastName && (!NAME_RE.test(lastName) || lastName.length > 50)) found.lastName = "Use letters only (up to 50).";
    if (!email) found.email = "Email is required.";
    else if (!EMAIL_RE.test(email) || email.length > 254) found.email = "Enter a valid email address.";
    if (mobile && !PH_MOBILE.test(mobile)) found.mobile = "Enter a valid PH mobile number (e.g. 09171234567).";

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFormError("");
    const r = await adminApi("/api/admin/users", {
      method: "POST",
      body: {
        firstName,
        email,
        role: values.role,
        ...(lastName ? { lastName } : {}),
        ...(mobile ? { mobile } : {}),
      },
    });
    setBusy(false);

    if (r.ok) {
      onCreated({
        role: values.role,
        email,
        inviteEmailSent: (r.data as { inviteEmailSent?: boolean }).inviteEmailSent !== false,
      });
      return;
    }

    if (r.data.errors) {
      const mapped: Errors = {};
      for (const [k, msg] of Object.entries(r.data.errors)) {
        if (k in values) mapped[k as keyof Errors] = msg;
      }
      setErrors(mapped);
      if (Object.keys(mapped).length > 0) return;
    }
    setFormError(
      r.status === 429
        ? "Too many invitations. Please try again later."
        : (r.data.message ?? "We couldn't create the account. Please try again."),
    );
  }

  const label = (id: string, text: string, optional = false) => (
    <label htmlFor={`${uid}-${id}`} className="mb-1.5 block text-sm font-medium text-white">
      {text}
      {optional && <span className="text-white/50"> (optional)</span>}
    </label>
  );

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} role="alert" className="mt-1.5 text-sm text-red-300">
        {errors[k]}
      </p>
    ) : null;

  const attrs = (k: keyof Errors) => ({
    id: `${uid}-${k}`,
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
    className: cn(INPUT, errors[k] ? "border-red-400" : "border-white/15"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/75" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={submit}
        noValidate
        className="relative my-auto w-full max-w-md rounded-2xl border border-[#c8933a]/40 bg-[#0a0a0a] p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${uid}-title`} className="text-xl font-semibold text-[#f4d587]">
            Add account
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/65">
          We&apos;ll email an invitation so they can set their own password. The link is valid for 72 hours.
        </p>

        <fieldset className="mt-6">
          <legend className="mb-2 text-sm font-medium text-white">Account type</legend>
          <div role="radiogroup" className="flex gap-3">
            {(["customer", "rider"] as const).map((r) => (
              <label
                key={r}
                className="flex-1 cursor-pointer rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-center text-sm font-medium capitalize transition-colors has-[:checked]:border-[#efc673] has-[:checked]:bg-[#efc673]/15 has-[:checked]:text-[#f4d587] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#efc673]/60"
              >
                <input
                  type="radio"
                  name={`${uid}-role`}
                  value={r}
                  checked={values.role === r}
                  onChange={() => setValues((v) => ({ ...v, role: r }))}
                  className="sr-only"
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {label("firstName", "First name")}
              <input
                ref={firstRef}
                {...attrs("firstName")}
                value={values.firstName}
                onChange={set("firstName")}
                autoComplete="off"
                maxLength={50}
              />
              {err("firstName")}
            </div>
            <div>
              {label("lastName", "Last name", true)}
              <input
                {...attrs("lastName")}
                value={values.lastName}
                onChange={set("lastName")}
                autoComplete="off"
                maxLength={50}
              />
              {err("lastName")}
            </div>
          </div>

          <div>
            {label("email", "Email")}
            <input
              {...attrs("email")}
              type="email"
              value={values.email}
              onChange={set("email")}
              autoComplete="off"
              maxLength={254}
            />
            {err("email")}
          </div>

          <div>
            {label("mobile", "Mobile number", true)}
            <input
              {...attrs("mobile")}
              type="tel"
              inputMode="tel"
              value={values.mobile}
              onChange={set("mobile")}
              placeholder="09XX XXX XXXX"
              autoComplete="off"
              maxLength={20}
            />
            {err("mobile")}
          </div>
        </div>

        <div aria-live="polite" className="mt-4 min-h-5">
          {formError && (
            <p role="alert" className="text-sm text-red-300">
              {formError}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-[#efc673]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            aria-busy={busy}
            className="min-h-11 rounded-xl px-6 text-sm font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            {busy ? "Creating…" : "Create and send invite"}
          </button>
        </div>
      </form>
    </div>
  );
}