import { Schema, model } from "mongoose";

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    image: { type: String, default: "", maxlength: 500 },
    /** Inclusive date span, YYYY-MM-DD in Philippine time. */
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true },
);

announcementSchema.index({ published: 1, startDate: 1, endDate: 1 });

export const Announcement = model("Announcement", announcementSchema, "Announcements");