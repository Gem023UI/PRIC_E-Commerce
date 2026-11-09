import { Schema, model } from "mongoose";

export const INQUIRY_SERVICES = [
  "rentals",
  "financing",
  "savings-loans",
  "production",
] as const;
export type InquiryService = (typeof INQUIRY_SERVICES)[number];

export const INQUIRY_SERVICE_LABELS: Record<InquiryService, string> = {
  rentals: "Rentals for Catering Events",
  financing: "Loans and Micro-financing",
  "savings-loans": "Savings and Loans",
  production: "Manufacturing and Production",
};

const inquirySchema = new Schema(
  {
    service: { type: String, enum: INQUIRY_SERVICES, required: true, index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    emailVerifiedAt: { type: Date, required: true },
    emailNotifiedAt: { type: Date, default: null },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
  },
  { timestamps: true },
);

inquirySchema.index({ createdAt: -1 });

export const Inquiry = model("Inquiry", inquirySchema, "Inquiries");