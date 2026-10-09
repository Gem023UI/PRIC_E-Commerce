import { z } from "zod";

const clean = (v: string) =>
  v.replace(/[\p{Cc}<>]/gu, "").replace(/\s+/g, " ").trim();

const PERSON_NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
const PH_MOBILE = /^(?:\+639|639|09)\d{9}$/;

const personName = (label: string) =>
  z
    .string()
    .transform(clean)
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .max(50, `${label} is too long`)
        .regex(PERSON_NAME, `${label} can only contain letters`),
    );

const emailField = z
  .string()
  .transform((v) => clean(v).toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Email address is required")
      .max(254, "Email address is too long")
      .email("Enter a valid email address"),
  );

const mobileField = z
  .string()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .pipe(
    z
      .string()
      .min(1, "Mobile number is required")
      .regex(PH_MOBILE, "Enter a valid PH mobile number (e.g. 09171234567)"),
  )
  .transform((v) => `+63${v.slice(-10)}`);

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number");

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password is too long"),
});

export const registerSchema = z
  .object({
    firstName: personName("First name"),
    lastName: personName("Last name"),
    mobile: mobileField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, "You must accept the Terms and Conditions"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const emailOnlySchema = z.object({ email: emailField });

export type LoginBody = z.output<typeof loginSchema>;
export type RegisterBody = z.output<typeof registerSchema>;
export type EmailBody = z.output<typeof emailOnlySchema>;