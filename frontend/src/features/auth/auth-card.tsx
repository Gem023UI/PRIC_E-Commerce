"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { clearSessionCache } from "@/hooks/use-session";
import type { AuthNotice } from "@/lib/auth-notice";
import { fieldErrors, loginSchema } from "@/lib/auth-schema";
import { anton } from "@/lib/fonts";
import { homeForRole } from "@/lib/roles";
import { GOLD_GRADIENT } from "@/lib/theme";

import {
  ArrowLeftIcon,
  AUTH_IMAGE,
  AuthShell,
  Field,
  MailIcon,
  Notice,
  PrimaryButton,
} from "./auth-ui";

type Errors = Record<string, string>;

type LoginResponse = {
  code?: string;
  user?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    role?: string;
  };
};

function useResend(email: string) {
  const [state, setState] = React.useState<"idle" | "sending" | "sent" | "error">("idle");
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

function LoginForm({ notice }: { notice: AuthNotice }) {
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
      const data = (await res.json().catch(() => ({}))) as LoginResponse;

      if (!res.ok) {
        if (data.code === "email_not_verified") setUnverified(true);
        else if (data.code === "account_deactivated")
          setFormError("Your account has been deactivated. Please contact PRIC.");
        else if (res.status === 429)
          setFormError("Too many attempts. Please try again later.");
        else setFormError("Invalid email or password.");
        return;
      }

      clearSessionCache();
      const u = data.user;
      if (u) {
        // Read by the checkout page to prefill name, email and phone.
        try {
          window.localStorage.setItem(
            "pric-user",
            JSON.stringify({
              name: u.name,
              firstName: u.firstName,
              lastName: u.lastName,
              email: u.email,
              mobile: u.mobile,
            }),
          );
        } catch {
          /* storage unavailable */
        }
      }
      router.replace(homeForRole(u?.role));
      router.refresh();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="my-auto w-full py-2">
      <p className="text-sm text-white/70">Login to PRIC</p>
      <MetallicGoldText
        as="h1"
        className={anton.className}
        style={{
          display: "block",
          marginTop: 4,
          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
          lineHeight: 1.15,
        }}
      >
        Where Farmers Grow Together
      </MetallicGoldText>

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

      <p className="mt-6 text-center text-xs leading-relaxed text-white/60">
        Accounts are created by PRIC. If you need access, contact the cooperative for an
        invitation. Ordering doesn&apos;t require an account.
      </p>
    </div>
  );
}

export function AuthCard({ notice }: { notice: AuthNotice }) {
  return (
    <AuthShell>
      <Reveal y={20} className="w-full max-w-[440px] md:max-w-[1000px]">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/20 bg-transparent/45 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:min-h-[600px] md:grid-cols-2">
          {/* Picture panel (desktop) */}
          <aside className="hidden p-3 md:block">
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
                <p className="text-sm font-medium uppercase tracking-widest text-[#f4d587]">
                  Welcome back
                </p>
                <h2 className={`${anton.className} mt-2 text-3xl leading-tight text-white`}>
                  Grow with our cooperative.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Log in to track your orders, manage deliveries, or open the admin dashboard.
                </p>
                <Link
                  href="/membership"
                  className="mt-5 inline-block rounded-full px-7 py-2.5 text-sm font-semibold text-[#2a1802] shadow-lg transition hover:scale-105 hover:brightness-110"
                  style={{ backgroundImage: GOLD_GRADIENT }}
                >
                  Become a member
                </Link>
              </div>
            </div>
          </aside>

          <section aria-label="Login" className="flex px-6 py-8 md:px-12 md:py-10">
            <LoginForm notice={notice} />
          </section>
        </div>
      </Reveal>

      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-[#f4d587]"
      >
        <ArrowLeftIcon /> Back to home
      </Link>
    </AuthShell>
  );
}

export default AuthCard;