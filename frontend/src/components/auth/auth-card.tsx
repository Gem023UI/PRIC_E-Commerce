"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Anton, Poppins } from "next/font/google";
import { MetallicGoldText } from "@/components/metallic-gold-text";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/auth-schema";
import type { AuthNotice } from "@/lib/auth-notice";
import { TermsModal } from "@/components/auth/terms-modal";
import { clearSessionCache } from "@/lib/use-session";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Temporary image, swap later.
const AUTH_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/758600144_4523738007949294_7588455720974017579_n_dvtcyq.jpg";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

type Mode = "login" | "register";
type Errors = Record<string, string>;
type Provider = "google" | "facebook";

/* ---------------------------------- icons --------------------------------- */

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const MailIcon = ({ className = "h-5 w-5" }) => (
  <svg {...svgProps} className={className}>
    <rect x="2" y="4" width="20" height="16" rx="3" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);
const EyeIcon = ({ className = "h-5 w-5" }) => (
  <svg {...svgProps} className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = ({ className = "h-5 w-5" }) => (
  <svg {...svgProps} className={className}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <path d="M1 1l22 22" />
  </svg>
);
const ArrowLeftIcon = ({ className = "h-4 w-4" }) => (
  <svg {...svgProps} className={className}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);
const GoogleIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
  </svg>
);
const FacebookIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M14 8.5V6.9c0-.7.2-1.1 1.2-1.1H17V3h-2.6c-2.6 0-3.700 1.600-3.700 3.700v1.800H8.500v3h2.200V21h3.300v-9.500h2.600l.4-3H14z" />
  </svg>
);

/* ------------------------------ small pieces ------------------------------ */

const INPUT =
  "h-12 w-full rounded-full border bg-white/5 px-5 pr-12 text-sm text-white outline-none transition placeholder:text-white/55 focus:bg-white/10 focus:ring-2 focus:ring-[#f4d587]/25 disabled:opacity-60";

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: React.ReactNode;
  password?: boolean;
  disabled?: boolean;
};

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  inputMode,
  icon,
  password,
  disabled,
}: FieldProps) {
  const [show, setShow] = React.useState(false);
  const errId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={password ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={cn(
            INPUT,
            error
              ? "border-red-400/70"
              : "border-white/25 focus:border-[#f4d587]/80",
          )}
        />
        {password ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 transition hover:text-[#f4d587]"
          >
            {show ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        ) : icon ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
            {icon}
          </span>
        ) : null}
      </div>
      {error && (
        <p id={errId} role="alert" className="mt-1.5 px-4 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Notice({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border px-4 py-2.5 text-sm",
        type === "error"
          ? "border-red-400/40 bg-red-500/10 text-red-200"
          : "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
      )}
    >
      {message}
    </p>
  );
}

function PrimaryButton({
  busy,
  children,
}: {
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="h-12 w-full rounded-full text-base font-semibold text-[#2a1802] shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ backgroundImage: GOLD_GRADIENT }}
    >
      {busy ? "Please wait…" : children}
    </button>
  );
}

function SocialButton({
  provider,
  busy,
  onClick,
}: {
  provider: Provider;
  busy: string | null;
  onClick: (p: Provider) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      disabled={busy !== null}
      className="flex h-12 items-center justify-center gap-2.5 rounded-full border border-white/25 bg-white/5 text-sm font-medium text-white transition hover:border-[#f4d587]/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {provider === "google" ? <GoogleIcon /> : <FacebookIcon />}
      {provider === "google" ? "Google" : "Facebook"}
    </button>
  );
}

function Socials({
  busy,
  onSocial,
}: {
  busy: string | null;
  onSocial: (p: Provider) => void;
}) {
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-white/50">
        <span className="h-px flex-1 bg-white/15" />
        or continue with
        <span className="h-px flex-1 bg-white/15" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SocialButton provider="google" busy={busy} onClick={onSocial} />
        <SocialButton provider="facebook" busy={busy} onClick={onSocial} />
      </div>
    </>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="hidden items-center gap-1.5 self-start text-sm text-white/70 transition hover:text-[#f4d587] md:inline-flex"
    >
      <ArrowLeftIcon /> Back
    </Link>
  );
}

function Heading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <p className="text-sm text-white/70">{kicker}</p>
      <MetallicGoldText
        as="h2"
        className={anton.className}
        style={{
          display: "block",
          marginTop: 4,
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          lineHeight: 1.15,
        }}
      >
        {title}
      </MetallicGoldText>
    </>
  );
}

function useResend(email: string) {
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const resend = React.useCallback(async () => {
    setState("sending");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }, [email]);
  return { state, resend, reset: () => setState("idle") };
}

/* -------------------------------- login form ------------------------------ */

function LoginForm({
  notice,
  socialBusy,
  onSocial,
  onSwitch,
}: {
  notice: AuthNotice;
  socialBusy: string | null;
  onSocial: (p: Provider) => void;
  onSwitch: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = React.useState({ email: "", password: "" });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [unverified, setUnverified] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const resend = useResend(values.email);

  const set = (k: keyof typeof values) => (v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setUnverified(false);
    resend.reset();

    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.code === "email_not_verified") setUnverified(true);
        else if (res.status === 429)
          setFormError("Too many attempts. Please try again later.");
        else setFormError("Invalid email or password.");
        return;
      }
      clearSessionCache();
      router.replace("/");
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <BackLink />
      <div className="my-auto py-4">
        <Heading kicker="Login to PRIC" title="Where Farmers Grow Together" />

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3.5">
          {notice && <Notice {...notice} />}
          {formError && <Notice type="error" message={formError} />}
          {unverified && (
            <div className="rounded-2xl border border-[#f4d587]/40 bg-[#f4d587]/10 px-4 py-2.5 text-sm text-[#fde7a0]">
              Please verify your email before logging in.{" "}
              {resend.state === "sent" ? (
                <span className="font-semibold">Verification email sent.</span>
              ) : (
                <button
                  type="button"
                  onClick={resend.resend}
                  disabled={resend.state === "sending"}
                  className="font-semibold underline underline-offset-2 disabled:opacity-60"
                >
                  {resend.state === "sending"
                    ? "Sending…"
                    : resend.state === "error"
                      ? "Failed, try again"
                      : "Resend link"}
                </button>
              )}
            </div>
          )}

          <Field
            id="login-email"
            label="Email address"
            type="email"
            autoComplete="email"
            icon={<MailIcon />}
            value={values.email}
            onChange={set("email")}
            error={errors.email}
            disabled={busy}
          />
          <Field
            id="login-password"
            label="Password"
            password
            autoComplete="current-password"
            value={values.password}
            onChange={set("password")}
            error={errors.password}
            disabled={busy}
          />
          <PrimaryButton busy={busy}>Login</PrimaryButton>
        </form>

        <Socials busy={socialBusy} onSocial={onSocial} />

        <p className="mt-6 text-center text-sm text-white/80 md:hidden">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-[#f4d587] hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ register form ----------------------------- */

const EMPTY_REGISTER = {
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

function RegisterForm({
  notice,
  socialBusy,
  onSocial,
  onSwitch,
}: {
  notice: AuthNotice;
  socialBusy: string | null;
  onSocial: (p: Provider) => void;
  onSwitch: () => void;
}) {
  const [values, setValues] = React.useState(EMPTY_REGISTER);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  const resend = useResend(sentTo ?? "");

  const [termsOpen, setTermsOpen] = React.useState(false);
  const closeTerms = React.useCallback(() => setTermsOpen(false), []);

  const set = (k: Exclude<keyof typeof values, "acceptTerms">) => (v: string) =>
    setValues((s) => ({ ...s, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    const errs = parsed.success ? {} : fieldErrors(parsed.error.issues);
    if (values.password !== values.confirmPassword && !errs.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (!parsed.success || Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        setSentTo(parsed.data.email);
        setValues(EMPTY_REGISTER);
        return;
      }
      if (data?.errors) {
        const { form, ...fields } = data.errors as Errors;
        setErrors(fields);
        if (form) setFormError(form);
      } else {
        setFormError(
          res.status === 429
            ? "Too many attempts. Please try again later."
            : "Something went wrong. Please try again.",
        );
      }s
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex min-h-full flex-col">
        <BackLink />
        <div className="my-auto py-4 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[#f4d587]/40 bg-white/5 text-[#f4d587]">
            <MailIcon className="h-7 w-7" />
          </div>
          <MetallicGoldText
            as="h2"
            className={anton.className}
            style={{
              display: "block",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              lineHeight: 1.15,
            }}
          >
            Check Your Inbox
          </MetallicGoldText>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-white/80">
            We sent a verification link to{" "}
            <span className="font-semibold text-white">{sentTo}</span>. Click it
            to activate your account, then log in.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={resend.resend}
              disabled={resend.state === "sending" || resend.state === "sent"}
              className="text-sm font-semibold text-[#f4d587] hover:underline disabled:opacity-60"
            >
              {resend.state === "sent"
                ? "Email sent again"
                : resend.state === "sending"
                  ? "Sending…"
                  : resend.state === "error"
                    ? "Failed, try again"
                    : "Didn't get it? Resend email"}
            </button>
            <button
              type="button"
              onClick={onSwitch}
              className="h-11 rounded-full px-8 text-sm font-semibold text-[#2a1802] transition hover:brightness-110"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <BackLink />
      <div className="my-auto py-4">
        <Heading kicker="Join PRIC" title="Start Growing With Us" />

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3.5">
          {notice && <Notice {...notice} />}
          {formError && <Notice type="error" message={formError} />}

          <div className="grid grid-cols-2 gap-3">
            <Field
              id="reg-first-name"
              label="First name"
              autoComplete="given-name"
              value={values.firstName}
              onChange={set("firstName")}
              error={errors.firstName}
              disabled={busy}
            />
            <Field
              id="reg-last-name"
              label="Last name"
              autoComplete="family-name"
              value={values.lastName}
              onChange={set("lastName")}
              error={errors.lastName}
              disabled={busy}
            />
          </div>
          <Field
            id="reg-mobile"
            label="Mobile number (09XXXXXXXXX)"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.mobile}
            onChange={set("mobile")}
            error={errors.mobile}
            disabled={busy}
          />
          <Field
            id="reg-email"
            label="Email address"
            type="email"
            autoComplete="email"
            icon={<MailIcon />}
            value={values.email}
            onChange={set("email")}
            error={errors.email}
            disabled={busy}
          />
          <Field
            id="reg-password"
            label="Password"
            password
            autoComplete="new-password"
            value={values.password}
            onChange={set("password")}
            error={errors.password}
            disabled={busy}
          />
          <Field
            id="reg-confirm-password"
            label="Confirm password"
            password
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={set("confirmPassword")}
            error={errors.confirmPassword}
            disabled={busy}
          />
          <p className="px-4 text-xs text-white/50">
            8+ characters with an uppercase letter, a lowercase letter and a
            number.
          </p>
          <div>
            <label
              htmlFor="reg-terms"
              className="flex cursor-pointer items-start gap-3 px-1 text-sm text-white/85"
            >
              <input
                id="reg-terms"
                type="checkbox"
                checked={values.acceptTerms}
                onChange={(e) =>
                  setValues((s) => ({ ...s, acceptTerms: e.target.checked }))
                }
                disabled={busy}
                aria-invalid={!!errors.acceptTerms}
                aria-describedby={errors.acceptTerms ? "reg-terms-error" : undefined}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#f4d587]/50",
                  values.acceptTerms
                    ? "border-transparent text-[#2a1802]"
                    : errors.acceptTerms
                      ? "border-red-400/70 bg-white/5"
                      : "border-white/40 bg-white/5",
                )}
                style={
                  values.acceptTerms ? { backgroundImage: GOLD_GRADIENT } : undefined
                }
              >
                {values.acceptTerms && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                )}
              </span>
              <span>
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="font-semibold text-[#f4d587] underline underline-offset-2 hover:brightness-125"
                >
                  Terms and Conditions
                </button>
              </span>
            </label>
            {errors.acceptTerms && (
              <p
                id="reg-terms-error"
                role="alert"
                className="mt-1.5 px-4 text-xs text-red-300"
              >
                {errors.acceptTerms}
              </p>
            )}
          </div>
          <PrimaryButton busy={busy}>Create account</PrimaryButton>
        </form>

        <Socials busy={socialBusy} onSocial={onSocial} />

        <p className="mt-6 text-center text-sm text-white/80 md:hidden">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-[#f4d587] hover:underline"
          >
            Login
          </button>
        </p>
      </div>
      <TermsModal
        open={termsOpen}
        onClose={closeTerms}
        onAccept={() => {
          setValues((s) => ({ ...s, acceptTerms: true }));
          setErrors((e) => ({ ...e, acceptTerms: "" }));
          setTermsOpen(false);
        }}
      />
    </div>
  );
}

/* ------------------------------ image panel ------------------------------- */

function PanelCopy({
  active,
  kicker,
  title,
  body,
  cta,
  onClick,
}: {
  active: boolean;
  kicker: string;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <div
      inert={!active}
      className={cn(
        "absolute inset-x-0 bottom-0 transition-all duration-500",
        active
          ? "translate-y-0 opacity-100 delay-300"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <p className="text-sm font-medium uppercase tracking-widest text-[#f4d587]">
        {kicker}
      </p>
      <h3
        className={cn(anton.className, "mt-2 text-3xl leading-tight text-white")}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-white/80">{body}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-5 rounded-full px-7 py-2.5 text-sm font-semibold text-[#2a1802] shadow-lg transition hover:scale-105 hover:brightness-110"
        style={{ backgroundImage: GOLD_GRADIENT }}
      >
        {cta}
      </button>
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Authentication mode"
      className="relative mb-5 grid w-full max-w-[440px] grid-cols-2 rounded-full border border-white/20 bg-black/40 p-1 backdrop-blur-xl md:hidden"
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full shadow transition-transform duration-300"
        style={{
          backgroundImage: GOLD_GRADIENT,
          transform: mode === "register" ? "translateX(100%)" : "none",
        }}
      />
      {(["login", "register"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 h-10 rounded-full text-sm font-semibold transition-colors",
            mode === m ? "text-[#2a1802]" : "text-white/80",
          )}
        >
          {m === "login" ? "Login" : "Register"}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- card ----------------------------------- */

export function AuthCard({
  initialMode,
  notice: initialNotice,
}: {
  initialMode: Mode;
  notice: AuthNotice;
}) {
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [notice, setNotice] = React.useState<AuthNotice>(initialNotice);
  const [socialBusy, setSocialBusy] = React.useState<string | null>(null);

  const go = React.useCallback((next: Mode) => {
    setMode(next);
    setNotice(null);
    const path = next === "login" ? "/login" : "/register";
    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, []);

  React.useEffect(() => {
    const sync = () =>
      setMode(
        window.location.pathname.startsWith("/register") ? "register" : "login",
      );
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const onSocial = React.useCallback((provider: Provider) => {
    setSocialBusy(provider);
    window.location.assign(`/api/auth/${provider}`);
  }, []);

  const panel = (active: boolean, side: "left" | "right") =>
    cn(
      "px-6 py-8 md:absolute md:top-0 md:h-full md:w-1/2 md:overflow-y-auto md:px-12 md:py-8 md:transition-opacity md:duration-500",
      side === "right" ? "md:left-1/2" : "md:left-0",
      active
        ? "block md:opacity-100 md:delay-300"
        : "hidden md:pointer-events-none md:block md:opacity-0",
    );

  return (
    <main
      className={cn(
        poppins.className,
        "relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-black px-4 py-6 text-white",
      )}
    >
      {/* Background */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center md:blur-xl"
          style={{ backgroundImage: `url(${AUTH_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <ModeToggle mode={mode} onChange={go} />

      <Reveal y={20} className="w-full max-w-[440px] md:max-w-[1040px]">
        <div className="relative w-full overflow-hidden rounded-[28px] border border-white/20 bg-black/45 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:h-[720px]">
          {/* Sliding picture panel (desktop) */}
          <div
            className="absolute left-0 top-0 z-10 hidden h-full w-1/2 p-3 transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)] will-change-transform md:block"
            style={{
              transform: mode === "register" ? "translateX(100%)" : "none",
            }}
          >
            <div className="relative h-full overflow-hidden rounded-[22px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={AUTH_IMAGE}
                alt="PRIC community"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1))",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <div className="relative min-h-[230px]">
                  <PanelCopy
                    active={mode === "login"}
                    kicker="New to PRIC?"
                    title="Grow with our cooperative."
                    body="Haven't registered yet? Create an account and join the farmers and neighbors growing together."
                    cta="Create an account"
                    onClick={() => go("register")}
                  />
                  <PanelCopy
                    active={mode === "register"}
                    kicker="Already a member?"
                    title="Welcome back."
                    body="Already have an account? Log in to pick up right where you left off."
                    cta="Login instead"
                    onClick={() => go("login")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Login: fields on the right */}
          <section
            aria-label="Login"
            inert={mode !== "login"}
            className={panel(mode === "login", "right")}
          >
            <LoginForm
              notice={notice}
              socialBusy={socialBusy}
              onSocial={onSocial}
              onSwitch={() => go("register")}
            />
          </section>

          {/* Register: fields on the left */}
          <section
            aria-label="Register"
            inert={mode !== "register"}
            className={panel(mode === "register", "left")}
          >
            <RegisterForm
              notice={notice}
              socialBusy={socialBusy}
              onSocial={onSocial}
              onSwitch={() => go("login")}
            />
          </section>
        </div>
      </Reveal>

      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-[#f4d587] md:hidden"
      >
        <ArrowLeftIcon /> Back to home
      </Link>
    </main>
  );
}

export default AuthCard;