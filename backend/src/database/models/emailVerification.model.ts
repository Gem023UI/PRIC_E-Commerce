import { Schema, model } from "mongoose";

const emailVerificationSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerification = model(
  "EmailVerification",
  emailVerificationSchema,
);