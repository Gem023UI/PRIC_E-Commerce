import { z } from "zod";

import { INQUIRY_SERVICES } from "../database/models/inquiry.model";

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

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{1,79}$/u;

const email = z
  .string({ error: "Email is required." })
  .max(320, "Enter a valid email address.")
  .transform((s) => oneLine(s).toLowerCase())
  .pipe(z.email({ error: "Enter a valid email address." }).max(254));

const fullName = z
  .string({ error: "Full name is required." })
  .max(200, "Full name is too long.")
  .transform(oneLine)
  .pipe(z.string().regex(NAME_RE, "Enter your full name using letters only."));

const phone = z
  .string({ error: "Phone number is required." })
  .max(40, "Enter a valid Philippine mobile number.")
  .transform((s) =>
    oneLine(s)
      .replace(/[\s().-]/g, "")
      .replace(/^\+?63(?=9\d{9}$)/, "0"),
  )
  .pipe(z.string().regex(/^09\d{9}$/, "Enter a valid Philippine mobile number."));

const message = z
  .string({ error: "Please tell us about your inquiry." })
  .max(4000, "Keep your message under 1,000 characters.")
  .transform(multiLine)
  .pipe(
    z
      .string()
      .min(10, "Please provide at least 10 characters.")
      .max(1000, "Keep your message under 1,000 characters."),
  );

export const otpRequestSchema = z.object({ email });

export const otpVerifySchema = z.object({
  email,
  code: z.string({ error: "Enter the 6-digit code." }).regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const createInquirySchema = z.object({
  service: z.enum(INQUIRY_SERVICES, { error: "Invalid service." }),
  fullName,
  email,
  phone,
  message,
  verificationToken: z
    .string({ error: "Verify your email before submitting." })
    .min(20, "Verify your email before submitting.")
    .max(2000),
});