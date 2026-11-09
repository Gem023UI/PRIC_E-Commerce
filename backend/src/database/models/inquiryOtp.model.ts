import { Schema, model } from "mongoose";

const inquiryOtpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Mongo removes the document once expiresAt passes.
inquiryOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const InquiryOtp = model("InquiryOtp", inquiryOtpSchema);