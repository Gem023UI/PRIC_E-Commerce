import { Schema, model } from "mongoose";

const RETENTION_DAYS = 800; // covers "This year" plus a year-over-year comparison

const pageViewSchema = new Schema(
  {
    /** Random anonymous id from the pric_vid cookie. No IP address or user id is stored. */
    visitorId: { type: String, required: true },
    path: { type: String, required: true },
    device: { type: String, enum: ["desktop", "mobile", "tablet"], default: "desktop" },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

// Expires old rows, and also serves the date-range queries.
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });
pageViewSchema.index({ visitorId: 1, path: 1, createdAt: -1 });

export const PageView = model("PageView", pageViewSchema, "PageViews");