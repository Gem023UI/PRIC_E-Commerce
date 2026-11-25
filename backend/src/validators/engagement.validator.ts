import { z } from "zod";

import { EVENT_STATUSES } from "../database/models/event.model";
import { APPLICATION_STATUSES } from "../database/models/membership.model";
import { SEMINAR_STATUSES } from "../database/models/pmesSeminar.model";
import { isRealDate, isSaturday } from "../utils/dates";

/* eslint-disable no-control-regex */
const clean = (s: string) =>
  s.normalize("NFKC").replace(/[\u0000-\u001F\u007F<>]/g, "").replace(/\s+/g, " ").trim();
/* eslint-enable no-control-regex */

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .max(max * 2, `${label} is too long.`)
    .transform(clean)
    .pipe(
      z
        .string()
        .min(min, min <= 1 ? `${label} is required.` : `${label} is too short.`)
        .max(max, `${label} is too long.`),
    );

const optText = (max: number, label = "This field") =>
  z
    .string()
    .max(max * 2, `${label} is too long.`)
    .transform(clean)
    .pipe(z.string().max(max, `${label} is too long.`))
    .optional();

const imageUrl = z
  .string()
  .max(500, "Image link is too long.")
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .regex(/^(https:\/\/[^\s"'<>]+|\/[A-Za-z0-9\-._~%/]+)$/, "Use an https:// image link or a /path from the site."),
  );

const date = (message: string) => z.string({ error: message }).refine(isRealDate, message);

const nonEmpty = (o: object) => Object.keys(o).length > 0;

/* ---------------------------------- events ---------------------------------- */

export const eventSchema = z.object({
  title: text("Title", 3, 200),
  location: text("Location", 2, 200),
  dateLabel: text("Date", 2, 80),
  /** "" clears it (events without a sort date list last). */
  sortDate: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.union([z.literal(""), z.string().refine(isRealDate, "Enter a valid date.")]))
    .optional()
    .transform((v) => v || null),
  time: optText(60),
  description: text("Description", 10, 5000),
  images: z.array(imageUrl).max(6, "Add up to 6 pictures.").default([]),
  status: z.enum(EVENT_STATUSES, { error: "Choose upcoming or past." }),
});
export type EventBody = z.output<typeof eventSchema>;

export const eventUpdateSchema = eventSchema.partial().refine(nonEmpty, "Nothing to update.");
export type EventUpdateBody = z.output<typeof eventUpdateSchema>;

/* ------------------------------- announcements ------------------------------- */

const announcementBase = z.object({
  title: text("Title", 2, 120),
  description: optText(1000, "The description"),
  /** "" means no image. */
  image: z.union([z.literal(""), imageUrl]).optional(),
  startDate: date("Choose a start date."),
  endDate: date("Choose an end date."),
  published: z.boolean({ error: "Choose whether it is visible." }),
});

export const announcementCreateSchema = announcementBase.refine((d) => d.endDate >= d.startDate, {
  path: ["endDate"],
  message: "The end date can't be before the start date.",
});
export type AnnouncementBody = z.output<typeof announcementCreateSchema>;

export const announcementUpdateSchema = announcementBase
  .partial()
  .refine(nonEmpty, "Nothing to update.");
export type AnnouncementUpdateBody = z.output<typeof announcementUpdateSchema>;

/* ---------------------------------- seminars ---------------------------------- */

const seminarBase = z.object({
  date: z
    .string({ error: "Choose a date." })
    .refine(isRealDate, "Choose a valid date.")
    .refine(isSaturday, "Seminars are held on Saturdays only."),
  startTime: optText(30, "The start time"),
  venue: optText(160, "The venue"),
  note: optText(300, "The note"),
  status: z.enum(SEMINAR_STATUSES, { error: "Choose open or closed." }),
});

export const seminarSchema = seminarBase;
export type SeminarBody = z.output<typeof seminarSchema>;

export const seminarUpdateSchema = seminarBase.partial().refine(nonEmpty, "Nothing to update.");
export type SeminarUpdateBody = z.output<typeof seminarUpdateSchema>;

/* ------------------------------ status changes ------------------------------ */

export const inquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "closed"], { error: "Invalid status." }),
});
export type InquiryStatusBody = z.output<typeof inquiryStatusSchema>;

export const applicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES, { error: "Invalid status." }),
  note: optText(300, "The note"),
});
export type ApplicationStatusBody = z.output<typeof applicationStatusSchema>;