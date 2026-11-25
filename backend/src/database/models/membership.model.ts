import { Schema, model } from "mongoose";

export const MEMBERSHIP_CATEGORIES = ["ARB", "ARB HH", "NON-ARB"] as const;
export const CIVIL_STATUSES = ["Single", "Married", "Widow", "Separated"] as const;
export const SEXES = ["Male", "Female"] as const;
export const APPLICATION_STATUSES = ["new", "under_review", "approved", "rejected"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const req = (max: number) => ({ type: String, required: true, trim: true, maxlength: max });
const opt = (max: number) => ({ type: String, default: "", trim: true, maxlength: max });

const beneficiarySchema = new Schema(
  { name: req(120), relationship: req(60), birthDate: req(10) },
  { _id: false },
);

const edu = { school: opt(160), year: opt(4) };

const applicationSchema = new Schema(
  {
    membershipCategory: { type: String, enum: MEMBERSHIP_CATEGORIES, required: true, index: true },

    lastName: req(80),
    firstName: req(80),
    middleName: opt(80),
    address: req(300),
    birthDate: req(10), // YYYY-MM-DD
    birthPlace: req(160),
    civilStatus: { type: String, enum: CIVIL_STATUSES, required: true },
    sex: { type: String, enum: SEXES, required: true },
    nationality: req(60),
    phone: req(30),

    religion: opt(80),
    weight: opt(20),
    height: opt(20),
    occupation: opt(160),

    motherName: opt(120),
    motherOccupation: opt(120),
    fatherName: opt(120),
    fatherOccupation: opt(120),
    spouseName: opt(120),
    spouseOccupation: opt(120),

    beneficiaries: {
      type: [beneficiarySchema],
      default: [],
      validate: (v: unknown[]) => v.length <= 3,
    },
    education: { college: edu, vocational: edu, secondary: edu, elementary: edu },
    ids: {
      tin: opt(40),
      pagibig: opt(40),
      sss: opt(40),
      philhealth: opt(40),
      seniorId: opt(40),
      nationalId: opt(40),
      other: opt(80),
    },

    /** The PMES seminar the applicant chose, YYYY-MM-DD (a Saturday). */
    scheduleDate: { ...req(10), index: true },
    signatureName: req(120),
    /** PNG data URL of the drawn signature; left out of normal queries. */
    signatureImage: { type: String, default: "", select: false },

    status: { type: String, enum: APPLICATION_STATUSES, default: "new", index: true },
    statusNote: opt(300),
    statusUpdatedAt: { type: Date, default: null },
    reviewedBy: opt(120),

    /** Lower-cased last|first|birthDate, to catch duplicate applications. */
    dedupeKey: { type: String, index: true },
  },
  { timestamps: true },
);

applicationSchema.index({ createdAt: -1 });

export const MembershipApplication = model(
  "MembershipApplication",
  applicationSchema,
  "MembershipApplications",
);