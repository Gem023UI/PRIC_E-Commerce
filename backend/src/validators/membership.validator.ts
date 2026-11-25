import { z } from "zod";

import {
  CIVIL_STATUSES,
  MEMBERSHIP_CATEGORIES,
  SEXES,
} from "../database/models/membership.model";
import { isRealDate, isSaturday, manilaToday } from "../utils/dates";

/* eslint-disable no-control-regex */
const oneLine = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
/* eslint-enable no-control-regex */

const required = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .max(max * 2, `${label} is too long.`)
    .transform(oneLine)
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `${label} is required.` : `${label} is too short.`)
        .max(max, `${label} is too long.`),
    );

const optional = (max: number, label = "This field") =>
  z
    .string()
    .max(max * 2, `${label} is too long.`)
    .transform(oneLine)
    .pipe(z.string().max(max, `${label} is too long.`))
    .optional()
    .transform((v) => v || undefined);

const dateString = (message: string) => z.string({ error: message }).refine(isRealDate, message);

const pastDate = (message: string) =>
  dateString(message).refine((d) => d <= manilaToday() && d >= "1900-01-01", message);

const year = z
  .string()
  .transform(oneLine)
  .pipe(z.string().regex(/^((19|20)\d{2})?$/, "Use a 4-digit year."))
  .optional()
  .transform((v) => v || undefined);

const educationEntry = z.object({ school: optional(160), year }).optional();

const NO_IDS = {
  tin: undefined,
  pagibig: undefined,
  sss: undefined,
  philhealth: undefined,
  seniorId: undefined,
  nationalId: undefined,
  other: undefined,
};

export const membershipApplicationSchema = z.object({
  membershipCategory: z.enum(MEMBERSHIP_CATEGORIES, { error: "Select a member type." }),

  lastName: required("Last name", 1, 80),
  firstName: required("First name", 1, 80),
  middleName: optional(80),
  address: required("Address", 5, 300),
  birthDate: pastDate("Enter a valid birth date."),
  birthPlace: required("Place of birth", 2, 160),
  civilStatus: z.enum(CIVIL_STATUSES, { error: "Select a civil status." }),
  sex: z.enum(SEXES, { error: "Select one." }),
  nationality: required("Nationality", 2, 60),
  phone: z
    .string({ error: "Phone number is required." })
    .max(60, "Enter a valid phone number.")
    .transform(oneLine)
    .pipe(
      z
        .string()
        .min(7, "Enter a valid phone number.")
        .max(30, "Enter a valid phone number.")
        .regex(/^[0-9+()\- ]+$/, "Enter a valid phone number."),
    ),

  religion: optional(80),
  weight: optional(20),
  height: optional(20),
  occupation: optional(160),

  motherName: optional(120),
  motherOccupation: optional(120),
  fatherName: optional(120),
  fatherOccupation: optional(120),
  spouseName: optional(120),
  spouseOccupation: optional(120),

  beneficiaries: z
    .array(
      z.object({
        name: required("Beneficiary name", 2, 120),
        relationship: required("Beneficiary relationship", 2, 60),
        birthDate: pastDate("Enter a valid beneficiary birth date."),
      }),
    )
    .max(3, "You can list up to 3 beneficiaries.")
    .default([]),

  education: z
    .object({
      college: educationEntry,
      vocational: educationEntry,
      secondary: educationEntry,
      elementary: educationEntry,
    })
    .default({}),

  ids: z
    .object({
      tin: optional(40),
      pagibig: optional(40),
      sss: optional(40),
      philhealth: optional(40),
      seniorId: optional(40),
      nationalId: optional(40),
      other: optional(80),
    })
    .default(NO_IDS),

  scheduleDate: dateString("Choose a seminar date.")
    .refine((d) => d > manilaToday(), "Choose a date after today.")
    .refine(isSaturday, "Seminars are held on Saturdays only."),
  signatureName: required("Signature name", 2, 120),
  signatureImage: z
    .string()
    .max(3_000_000, "The signature image is too large.")
    .regex(/^data:image\/png;base64,iVBORw0KGgo[A-Za-z0-9+/=]*$/, "Invalid signature image.")
    .optional(),
});

export type MembershipApplicationBody = z.output<typeof membershipApplicationSchema>;