"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { fieldErrors, setPasswordSchema } from "@/lib/auth-schema";
import { anton } from "@/lib/fonts";

import { ArrowLeftIcon, AuthShell, Field, Notice, PrimaryButton } from "./auth-ui";

export function SetPasswordPage({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [values, setValues] = React.useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const invalidLink = !token || !email;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsed = setPasswordSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, ...values }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        errors?: Record<string, string>;
      };
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        setFormError(
          res.status === 429
            ? "Too many attempts. Please try again later."
            : (data.message ?? "Something went wrong. Please try again."),
        );
        return;
      }
      router.replace("/login?passwordSet=1");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <Reveal y={20} className="w-full max-w-[440px]">
        <div className="w-full rounded-[28px] border border-white/20 bg-transparent/45 px-6 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl md:px-10 md:py-10">
          <p className="text-sm text-white/70">Welcome to PRIC</p>
          <MetallicGoldText
            as="h1"
            className={anton.className}
            style={{
              display: "block",
              marginTop: 4,
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              lineHeight: 1.15,
            }}
          >
            Set Your Password
          </MetallicGoldText>

          {invalidLink ? (
            <div className="mt-6">
              <Notice
                type="error"
                message="This link is incomplete. Please use the link from your invitation email."
              />
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-3.5">
              <p className="px-1 text-sm text-white/75">
                Choose a password for <span className="break-all font-semibold text-white">{email}</span>.
              </p>
              {formError && <Notice type="error" message={formError} />}
              <Field
                id="new-password"
                label="New password"
                password
                autoComplete="new-password"
                value={values.password}
                onChange={(v) => setValues((s) => ({ ...s, password: v }))}
                error={errors.password}
                disabled={busy}
              />
              <Field
                id="confirm-password"
                label="Confirm password"
                password
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={(v) => setValues((s) => ({ ...s, confirmPassword: v }))}
                error={errors.confirmPassword}
                disabled={busy}
              />
              <p className="px-4 text-xs text-white/50">
                8+ characters with an uppercase letter, a lowercase letter and a number.
              </p>
              <PrimaryButton busy={busy}>Save password</PrimaryButton>
            </form>
          )}
        </div>
      </Reveal>

      <Link
        href="/login"
        className="mt-5 inline-flex items-center gap-1.5 text-sm text-white/70 transition hover:text-[#f4d587]"
      >
        <ArrowLeftIcon /> Back to login
      </Link>
    </AuthShell>
  );
}

export default SetPasswordPage;