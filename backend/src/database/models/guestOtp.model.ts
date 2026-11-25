import { Schema, model } from "mongoose";

const guestOtpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Mongo removes the document once expiresAt passes.
guestOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const GuestOtp = model("GuestOtp", guestOtpSchema);