import type { Request, RequestHandler } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

import { Announcement } from "../database/models/announcement.model";
import { EventEntry, type EventRecord } from "../database/models/event.model";
import { INQUIRY_SERVICES, Inquiry } from "../database/models/inquiry.model";
import {
  APPLICATION_STATUSES,
  MembershipApplication,
} from "../database/models/membership.model";
import { PmesSeminar } from "../database/models/pmesSeminar.model";
import { User } from "../database/models/user.model";
import {
  adminAnnouncementShape,
  adminAnnouncements,
  adminEventShape,
  adminEvents,
  adminSeminars,
  getApplicationDetail,
  getEngagementStats,
  inquiryShape,
  listApplications,
  listInquiries,
  seminarShape,
} from "../services/engagement.service";
import { RANGE_KEYS, resolveRange } from "../utils/dateRange";
import { manilaStart, manilaToday } from "../utils/dates";
import { HttpError } from "../utils/httpError";
import { parseQuery } from "../utils/parseQuery";
import type {
  AnnouncementBody,
  AnnouncementUpdateBody,
  ApplicationStatusBody,
  EventBody,
  EventUpdateBody,
  InquiryStatusBody,
  SeminarBody,
  SeminarUpdateBody,
} from "../validators/engagement.validator";

const idOf = (raw: unknown, what: string) => {
  const id = String(raw ?? "");
  if (!isValidObjectId(id)) throw new HttpError(404, `${what} not found`);
  return id;
};

async function adminName(req: Request) {
  const u = await User.findById(req.auth!.userId).select("firstName lastName");
  return u ? `${u.firstName} ${u.lastName ?? ""}`.trim() : "Admin";
}

const isDuplicate = (err: unknown) => (err as { code?: number }).code === 11000;

/* ----------------------------------- stats ----------------------------------- */

const rangeQuery = z.object({ range: z.enum(RANGE_KEYS).default("last7") });

export const engagementStats: RequestHandler = async (req, res) => {
  const { range } = parseQuery(rangeQuery, req.query);
  res.json(await getEngagementStats(resolveRange(range)));
};

/* --------------------------------- inquiries --------------------------------- */

const inquiryQuery = z.object({
  status: z.enum(["open", "all", "new", "contacted", "closed"]).default("open"),
  service: z.enum(["all", ...INQUIRY_SERVICES]).default("all"),
  search: z.string().trim().max(80).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export const inquiriesList: RequestHandler = async (req, res) => {
  res.json(await listInquiries(parseQuery(inquiryQuery, req.query)));
};

export const inquiryStatus: RequestHandler = async (req, res) => {
  const { status } = req.body as InquiryStatusBody;
  const inquiry = await Inquiry.findByIdAndUpdate(idOf(req.params.id, "Inquiry"), { status }, { new: true }).lean();
  if (!inquiry) throw new HttpError(404, "Inquiry not found");
  res.json({ inquiry: inquiryShape(inquiry as unknown as Parameters<typeof inquiryShape>[0]) });
};

/* ---------------------------- membership applications ---------------------------- */

const applicationQuery = z.object({
  status: z.enum(["all", ...APPLICATION_STATUSES]).default("all"),
  category: z.enum(["all", "ARB", "ARB HH", "NON-ARB"]).default("all"),
  seminar: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(""),
  search: z.string().trim().max(80).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});

export const applicationsList: RequestHandler = async (req, res) => {
  res.json(await listApplications(parseQuery(applicationQuery, req.query)));
};

export const applicationDetail: RequestHandler = async (req, res) => {
  const detail = await getApplicationDetail(idOf(req.params.id, "Application"));
  if (!detail) throw new HttpError(404, "Application not found");
  res.json({ application: detail });
};

export const applicationStatus: RequestHandler = async (req, res) => {
  const { status, note } = req.body as ApplicationStatusBody;
  const id = idOf(req.params.id, "Application");

  const updated = await MembershipApplication.findByIdAndUpdate(id, {
    status,
    statusNote: note ?? "",
    statusUpdatedAt: new Date(),
    reviewedBy: await adminName(req),
  });
  if (!updated) throw new HttpError(404, "Application not found");

  res.json({ application: await getApplicationDetail(id) });
};

/* ---------------------------------- seminars ---------------------------------- */

export const seminarsList: RequestHandler = async (_req, res) => {
  res.json(await adminSeminars());
};

const taken = () =>
  new HttpError(409, "A seminar is already scheduled on that date.", "seminar_exists", {
    date: "A seminar is already scheduled on that date.",
  });

export const seminarCreate: RequestHandler = async (req, res) => {
  const b = req.body as SeminarBody;
  if (b.date < manilaToday()) {
    throw new HttpError(400, "Choose today or a future Saturday.", "past_date", {
      date: "Choose today or a future Saturday.",
    });
  }

  try {
    const doc = await PmesSeminar.create({
      date: b.date,
      startTime: b.startTime || "8:00 AM",
      venue: b.venue ?? "",
      note: b.note ?? "",
      status: b.status,
    });
    res.status(201).json({ seminar: seminarShape(doc.toObject() as unknown as Parameters<typeof seminarShape>[0]) });
  } catch (err) {
    if (isDuplicate(err)) throw taken();
    throw err;
  }
};

export const seminarUpdate: RequestHandler = async (req, res) => {
  const b = req.body as SeminarUpdateBody;
  const seminar = await PmesSeminar.findById(idOf(req.params.id, "Seminar"));
  if (!seminar) throw new HttpError(404, "Seminar not found");

  if (b.date !== undefined) seminar.date = b.date;
  if (b.startTime !== undefined) seminar.startTime = b.startTime || "8:00 AM";
  if (b.venue !== undefined) seminar.venue = b.venue;
  if (b.note !== undefined) seminar.note = b.note;
  if (b.status !== undefined) seminar.status = b.status;

  try {
    await seminar.save();
  } catch (err) {
    if (isDuplicate(err)) throw taken();
    throw err;
  }
  res.json({ seminar: seminarShape(seminar.toObject() as unknown as Parameters<typeof seminarShape>[0]) });
};

export const seminarDelete: RequestHandler = async (req, res) => {
  const result = await PmesSeminar.deleteOne({ _id: idOf(req.params.id, "Seminar") });
  if (result.deletedCount === 0) throw new HttpError(404, "Seminar not found");
  res.json({ ok: true });
};

/* ----------------------------------- events ----------------------------------- */

export const eventsList: RequestHandler = async (_req, res) => {
  res.json({ events: await adminEvents() });
};

export const eventCreate: RequestHandler = async (req, res) => {
  const b = req.body as EventBody;

  let created;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    const top = await EventEntry.findOne().sort({ eventId: -1 }).select("eventId").lean();
    try {
      created = await EventEntry.create({
        eventId: (top?.eventId ?? 0) + 1,
        status: b.status,
        title: b.title,
        location: b.location,
        dateLabel: b.dateLabel,
        sortDate: b.sortDate ? manilaStart(b.sortDate) : null,
        time: b.time || "Time not specified",
        description: b.description,
        images: b.images,
      });
    } catch (err) {
      if (!isDuplicate(err)) throw err; // only retry id collisions
    }
  }
  if (!created) throw new HttpError(500, "Could not create the event. Please try again.");

  res.status(201).json({ event: adminEventShape(created.toObject() as unknown as EventRecord) });
};

async function findEvent(raw: unknown) {
  const id = Number(raw);
  const event = Number.isInteger(id) ? await EventEntry.findOne({ eventId: id }) : null;
  if (!event) throw new HttpError(404, "Event not found");
  return event;
}

export const eventUpdate: RequestHandler = async (req, res) => {
  const b = req.body as EventUpdateBody;
  const event = await findEvent(req.params.id);

  if (b.status !== undefined) event.status = b.status;
  if (b.title !== undefined) event.title = b.title;
  if (b.location !== undefined) event.location = b.location;
  if (b.dateLabel !== undefined) event.dateLabel = b.dateLabel;
  if (b.sortDate !== undefined) event.sortDate = b.sortDate ? manilaStart(b.sortDate) : null;
  if (b.time !== undefined) event.time = b.time || "Time not specified";
  if (b.description !== undefined) event.description = b.description;
  if (b.images !== undefined) event.images = b.images;
  await event.save();

  res.json({ event: adminEventShape(event.toObject() as unknown as EventRecord) });
};

export const eventDelete: RequestHandler = async (req, res) => {
  const event = await findEvent(req.params.id);
  await event.deleteOne();
  res.json({ ok: true });
};

/* -------------------------------- announcements -------------------------------- */

export const announcementsList: RequestHandler = async (_req, res) => {
  res.json({ announcements: await adminAnnouncements() });
};

type AnnouncementDoc = Parameters<typeof adminAnnouncementShape>[0];

export const announcementCreate: RequestHandler = async (req, res) => {
  const b = req.body as AnnouncementBody;
  const doc = await Announcement.create({
    title: b.title,
    description: b.description ?? "",
    image: b.image ?? "",
    startDate: b.startDate,
    endDate: b.endDate,
    published: b.published,
  });
  res.status(201).json({ announcement: adminAnnouncementShape(doc.toObject() as unknown as AnnouncementDoc) });
};

export const announcementUpdate: RequestHandler = async (req, res) => {
  const b = req.body as AnnouncementUpdateBody;
  const doc = await Announcement.findById(idOf(req.params.id, "Announcement"));
  if (!doc) throw new HttpError(404, "Announcement not found");

  const startDate = b.startDate ?? doc.startDate;
  const endDate = b.endDate ?? doc.endDate;
  if (endDate < startDate) {
    throw new HttpError(400, "The end date can't be before the start date.", "invalid_range", {
      endDate: "The end date can't be before the start date.",
    });
  }

  if (b.title !== undefined) doc.title = b.title;
  if (b.description !== undefined) doc.description = b.description;
  if (b.image !== undefined) doc.image = b.image;
  if (b.published !== undefined) doc.published = b.published;
  doc.startDate = startDate;
  doc.endDate = endDate;
  await doc.save();

  res.json({ announcement: adminAnnouncementShape(doc.toObject() as unknown as AnnouncementDoc) });
};

export const announcementDelete: RequestHandler = async (req, res) => {
  const result = await Announcement.deleteOne({ _id: idOf(req.params.id, "Announcement") });
  if (result.deletedCount === 0) throw new HttpError(404, "Announcement not found");
  res.json({ ok: true });
};