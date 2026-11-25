import { Schema, model } from "mongoose";

export const SEMINAR_STATUSES = ["open", "closed"] as const;

const pmesSeminarSchema = new Schema(
  {
    /** YYYY-MM-DD; always a Saturday (enforced by the API). */
    date: { type: String, required: true, unique: true },
    startTime: { type: String, default: "8:00 AM", trim: true, maxlength: 30 },
    venue: { type: String, default: "", trim: true, maxlength: 160 },
    note: { type: String, default: "", trim: true, maxlength: 300 },
    status: { type: String, enum: SEMINAR_STATUSES, default: "open" },
  },
  { timestamps: true },
);

export const PmesSeminar = model("PmesSeminar", pmesSeminarSchema, "PmesSeminars");