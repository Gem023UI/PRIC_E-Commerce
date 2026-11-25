import { type InferSchemaType, Schema, type Types, model } from "mongoose";

export const EVENT_STATUSES = ["upcoming", "latest"] as const;

const eventSchema = new Schema(
  {
    /** The public numeric id used in /events/<id> URLs. */
    eventId: { type: Number, required: true, unique: true },
    status: { type: String, enum: EVENT_STATUSES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    /** The date as shown on the site, e.g. "December 12–14, 2026" or "April 2023". */
    dateLabel: { type: String, required: true, trim: true, maxlength: 80 },
    /** Only used to order events; events without one sort last. */
    sortDate: { type: Date, default: null },
    time: { type: String, default: "Time not specified", trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type EventRecord = InferSchemaType<typeof eventSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const EventEntry = model("Event", eventSchema, "Events");