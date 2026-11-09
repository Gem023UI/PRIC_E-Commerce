import { Schema, model } from "mongoose";

export const USER_STATUSES = ["pending", "verified", "deactivated"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const accountSchema = new Schema(
  {
    provider: { type: String, enum: ["google", "facebook"], required: true },
    providerAccountId: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, default: "", trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: { type: String },
    passwordHash: { type: String, select: false },
    emailVerified: { type: Date, default: null },
    status: {
      type: String,
      enum: USER_STATUSES,
      default: "pending",
      index: true,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "customer",
      index: true,
    },
    image: { type: String },
    accounts: { type: [accountSchema], default: [] },
    termsAcceptedAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.index({
  "accounts.provider": 1,
  "accounts.providerAccountId": 1,
});

export const User = model("User", userSchema);