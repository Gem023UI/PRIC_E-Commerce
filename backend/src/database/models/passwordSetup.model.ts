import { Schema, model } from "mongoose";

const passwordSetupSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Mongo removes the document once expiresAt passes.
passwordSetupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordSetup = model("PasswordSetup", passwordSetupSchema);