import type { Types } from "mongoose";

import { Announcement } from "../database/models/announcement.model";
import { EventEntry, type EventRecord } from "../database/models/event.model";
import {
  INQUIRY_SERVICE_LABELS,
  INQUIRY_SERVICES,
  Inquiry,
  type InquiryService,
} from "../database/models/inquiry.model";
import {
  APPLICATION_STATUSES,
  MembershipApplication,
  type ApplicationStatus,
} from "../database/models/membership.model";
import { PmesSeminar } from "../database/models/pmesSeminar.model";
import { buildBuckets, describeRange, type DateRange } from "../utils/dateRange";
import { manilaToday, nextSaturdays } from "../utils/dates";
import { bucketExpr, metric } from "./stats.service";

const PAGE_SIZE = 20;
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/* ----------------------------------- events ----------------------------------- */

/** Upcoming: soonest first. Past: newest first. Events without a sort date list last. */
function compareEvents(dir: 1 | -1) {
  return (a: EventRecord, b: EventRecord) => {
    const ta = a.sortDate ? a.sortDate.getTime() : null;
    const tb = b.sortDate ? b.sortDate.getTime() : null;
    if (ta === null && tb === null) return a.eventId - b.eventId;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta === tb ? a.eventId - b.eventId : (ta - tb) * dir;
  };
}

function sortEvents(rows: EventRecord[]) {
  return [
    ...rows.filter((e) => e.status === "upcoming").sort(compareEvents(1)),
    ...rows.filter((e) => e.status === "latest").sort(compareEvents(-1)),
  ];
}

const publicEventShape = (e: EventRecord) => {
  const images = e.images?.length ? e.images : [PLACEHOLDER_IMAGE];
  return {
    id: e.eventId,
    status: e.status,
    title: e.title,
    location: e.location,
    date: e.dateLabel,
    time: e.time,
    description: e.description,
    image: images[0] ?? PLACEHOLDER_IMAGE,
    images,
  };
};

export const adminEventShape = (e: EventRecord) => ({
  id: e.eventId,
  status: e.status,
  title: e.title,
  location: e.location,
  dateLabel: e.dateLabel,
  sortDate: e.sortDate ? manilaToday(e.sortDate) : "",
  time: e.time,
  description: e.description,
  images: e.images ?? [],
  updatedAt: e.updatedAt.toISOString(),
});

const allEvents = async () => (await EventEntry.find().lean()) as unknown as EventRecord[];

export async function publicEvents() {
  return sortEvents(await allEvents()).map(publicEventShape);
}

export async function publicEvent(eventId: number) {
  const e = (await EventEntry.findOne({ eventId }).lean()) as unknown as EventRecord | null;
  return e ? publicEventShape(e) : null;
}

export async function adminEvents() {
  return sortEvents(await allEvents()).map(adminEventShape);
}

/* -------------------------------- announcements -------------------------------- */

type AnnouncementRow = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type AnnouncementState = "active" | "scheduled" | "expired" | "hidden";

const announcementState = (a: AnnouncementRow, today: string): AnnouncementState =>
  !a.published ? "hidden" : a.endDate < today ? "expired" : a.startDate > today ? "scheduled" : "active";

export const adminAnnouncementShape = (a: AnnouncementRow, today = manilaToday()) => ({
  id: String(a._id),
  title: a.title,
  description: a.description,
  image: a.image,
  startDate: a.startDate,
  endDate: a.endDate,
  published: a.published,
  state: announcementState(a, today),
});

export async function adminAnnouncements() {
  const today = manilaToday();
  const rows = (await Announcement.find()
    .sort({ startDate: -1, createdAt: -1 })
    .lean()) as unknown as AnnouncementRow[];
  return rows.map((a) => adminAnnouncementShape(a, today));
}

export async function activeAnnouncements() {
  const today = manilaToday();
  const rows = (await Announcement.find({
    published: true,
    startDate: { $lte: today },
    endDate: { $gte: today },
  })
    .sort({ startDate: -1, createdAt: -1 })
    .limit(5)
    .lean()) as unknown as AnnouncementRow[];

  return rows.map((a) => ({
    id: String(a._id),
    // Changes whenever the announcement is edited, so visitors see an edited one again.
    version: `${a._id}:${a.updatedAt.getTime()}`,
    title: a.title,
    description: a.description,
    image: a.image,
    startDate: a.startDate,
    endDate: a.endDate,
  }));
}

/* ---------------------------------- seminars ---------------------------------- */

type SeminarDoc = {
  _id: Types.ObjectId;
  date: string;
  startTime: string;
  venue: string;
  note: string;
  status: "open" | "closed";
};

export const seminarShape = (s: SeminarDoc, applicants = 0) => ({
  id: String(s._id),
  date: s.date,
  startTime: s.startTime,
  venue: s.venue,
  note: s.note,
  status: s.status,
  applicants,
});

export async function publicSeminars() {
  const today = manilaToday();
  const rows = (await PmesSeminar.find({ date: { $gte: today }, status: "open" })
    .sort({ date: 1 })
    .limit(8)
    .lean()) as unknown as SeminarDoc[];
  const upcoming = rows.map((s) => seminarShape(s));

  return {
    today,
    next: upcoming[0] ?? null,
    upcoming,
    // Used by the form while no seminar is scheduled: applicants pick a preferred Saturday.
    fallbackSaturdays: nextSaturdays(today, 4),
  };
}

export async function adminSeminars() {
  const today = manilaToday();
  const [upcomingRaw, pastRaw, counts] = await Promise.all([
    PmesSeminar.find({ date: { $gte: today } }).sort({ date: 1 }).lean(),
    PmesSeminar.find({ date: { $lt: today } }).sort({ date: -1 }).limit(8).lean(),
    MembershipApplication.aggregate<{ _id: string; n: number }>([
      { $match: { status: { $ne: "rejected" } } },
      { $group: { _id: "$scheduleDate", n: { $sum: 1 } } },
    ]),
  ]);

  const byDate = new Map(counts.map((c) => [c._id, c.n]));
  const upcoming = (upcomingRaw as unknown as SeminarDoc[]).map((s) => seminarShape(s, byDate.get(s.date) ?? 0));
  const past = (pastRaw as unknown as SeminarDoc[]).map((s) => seminarShape(s, byDate.get(s.date) ?? 0));

  // Saturdays applicants asked for that have no seminar yet.
  const scheduled = new Set(upcoming.map((s) => s.date));
  const requestedDates = counts
    .filter((c) => c._id >= today && !scheduled.has(c._id))
    .sort((a, b) => a._id.localeCompare(b._id))
    .map((c) => ({ date: c._id, applicants: c.n }));

  return { upcoming, past, requestedDates };
}

/* ---------------------------------- inquiries ---------------------------------- */

export type InquiryListQuery = {
  status: "open" | "all" | "new" | "contacted" | "closed";
  service: "all" | InquiryService;
  search: string;
  page: number;
};

type InquiryDoc = {
  _id: Types.ObjectId;
  service: InquiryService;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: Date;
};

export const inquiryShape = (i: InquiryDoc) => ({
  id: String(i._id),
  service: i.service,
  serviceLabel: INQUIRY_SERVICE_LABELS[i.service] ?? i.service,
  fullName: i.fullName,
  email: i.email,
  phone: i.phone,
  message: i.message,
  status: i.status,
  createdAt: i.createdAt.toISOString(),
});

export async function listInquiries(q: InquiryListQuery) {
  const filter: Record<string, unknown> = {};
  if (q.status === "open") filter.status = { $in: ["new", "contacted"] };
  else if (q.status !== "all") filter.status = q.status;
  if (q.service !== "all") filter.service = q.service;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
  }

  const [total, countRows] = await Promise.all([
    Inquiry.countDocuments(filter),
    Inquiry.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pages);
  const rows = (await Inquiry.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean()) as unknown as InquiryDoc[];

  const by = new Map(countRows.map((c) => [c._id, c.n]));
  const n = (s: string) => by.get(s) ?? 0;

  return {
    total,
    page,
    pages,
    pageSize: PAGE_SIZE,
    counts: {
      all: n("new") + n("contacted") + n("closed"),
      open: n("new") + n("contacted"),
      new: n("new"),
      contacted: n("contacted"),
      closed: n("closed"),
    },
    inquiries: rows.map(inquiryShape),
  };
}

/* ------------------------------ membership applications ------------------------------ */

export type ApplicationListQuery = {
  status: "all" | ApplicationStatus;
  category: "all" | "ARB" | "ARB HH" | "NON-ARB";
  seminar: string; // "" or YYYY-MM-DD
  search: string;
  page: number;
};

type ApplicationDoc = {
  _id: Types.ObjectId;
  membershipCategory: string;
  lastName: string;
  firstName: string;
  middleName: string;
  phone: string;
  scheduleDate: string;
  status: ApplicationStatus;
  createdAt: Date;
};

const reference = (id: unknown) => `#${String(id).slice(-6).toUpperCase()}`;
export const applicationReference = reference;

const applicationRow = (a: ApplicationDoc) => ({
  id: String(a._id),
  reference: reference(a._id),
  name: `${a.lastName}, ${a.firstName}${a.middleName ? ` ${a.middleName}` : ""}`,
  category: a.membershipCategory,
  phone: a.phone,
  scheduleDate: a.scheduleDate,
  status: a.status,
  createdAt: a.createdAt.toISOString(),
});

export async function listApplications(q: ApplicationListQuery) {
  const filter: Record<string, unknown> = {};
  if (q.status !== "all") filter.status = q.status;
  if (q.category !== "all") filter.membershipCategory = q.category;
  if (q.seminar) filter.scheduleDate = q.seminar;
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ lastName: rx }, { firstName: rx }, { phone: rx }];
  }

  const [total, countRows] = await Promise.all([
    MembershipApplication.countDocuments(filter),
    MembershipApplication.aggregate<{ _id: ApplicationStatus; n: number }>([
      ...(q.seminar ? [{ $match: { scheduleDate: q.seminar } }] : []),
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pages);
  const rows = (await MembershipApplication.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean()) as unknown as ApplicationDoc[];

  const by = new Map(countRows.map((c) => [c._id, c.n]));
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, by.get(s) ?? 0])) as Record<
    ApplicationStatus,
    number
  >;

  return {
    total,
    page,
    pages,
    pageSize: PAGE_SIZE,
    counts: { all: Object.values(counts).reduce((s, n) => s + n, 0), ...counts },
    applications: rows.map(applicationRow),
  };
}

type ApplicationFull = ApplicationDoc & {
  address: string;
  birthDate: string;
  birthPlace: string;
  civilStatus: string;
  sex: string;
  nationality: string;
  religion: string;
  weight: string;
  height: string;
  occupation: string;
  motherName: string;
  motherOccupation: string;
  fatherName: string;
  fatherOccupation: string;
  spouseName: string;
  spouseOccupation: string;
  beneficiaries: { name: string; relationship: string; birthDate: string }[];
  education: Record<"college" | "vocational" | "secondary" | "elementary", { school: string; year: string }>;
  ids: Record<"tin" | "pagibig" | "sss" | "philhealth" | "seniorId" | "nationalId" | "other", string>;
  signatureName: string;
  signatureImage?: string;
  statusNote: string;
  statusUpdatedAt: Date | null;
  reviewedBy: string;
};

export async function getApplicationDetail(id: string) {
  const a = (await MembershipApplication.findById(id)
    .select("+signatureImage")
    .lean()) as unknown as ApplicationFull | null;
  if (!a) return null;

  return {
    id: String(a._id),
    reference: reference(a._id),
    status: a.status,
    statusNote: a.statusNote,
    statusUpdatedAt: iso(a.statusUpdatedAt),
    reviewedBy: a.reviewedBy,
    createdAt: a.createdAt.toISOString(),
    membershipCategory: a.membershipCategory,
    lastName: a.lastName,
    firstName: a.firstName,
    middleName: a.middleName,
    address: a.address,
    birthDate: a.birthDate,
    birthPlace: a.birthPlace,
    civilStatus: a.civilStatus,
    sex: a.sex,
    nationality: a.nationality,
    phone: a.phone,
    religion: a.religion,
    weight: a.weight,
    height: a.height,
    occupation: a.occupation,
    motherName: a.motherName,
    motherOccupation: a.motherOccupation,
    fatherName: a.fatherName,
    fatherOccupation: a.fatherOccupation,
    spouseName: a.spouseName,
    spouseOccupation: a.spouseOccupation,
    beneficiaries: a.beneficiaries ?? [],
    education: a.education,
    ids: a.ids,
    scheduleDate: a.scheduleDate,
    signatureName: a.signatureName,
    signatureImage: a.signatureImage ?? "",
  };
}

/* ----------------------------------- stats ----------------------------------- */

export async function getEngagementStats(range: DateRange) {
  const { start, end, prevStart, prevEnd, granularity } = range;
  const today = manilaToday();
  const within = (s: Date, e: Date) => ({ createdAt: { $gte: s, $lt: e } });
  const bucketed = (match: Record<string, unknown>) => [
    { $match: match },
    { $group: { _id: bucketExpr("$createdAt", granularity), n: { $sum: 1 } } },
  ];

  const [
    inqCur,
    inqPrev,
    inqOpen,
    inqNew,
    appCur,
    appPrev,
    appPending,
    appNew,
    eventsUpcoming,
    eventsPast,
    annActive,
    annScheduled,
    nextSeminarRaw,
    inqSeries,
    appSeries,
  ] = await Promise.all([
    Inquiry.countDocuments(within(start, end)),
    Inquiry.countDocuments(within(prevStart, prevEnd)),
    Inquiry.countDocuments({ status: { $in: ["new", "contacted"] } }),
    Inquiry.countDocuments({ status: "new" }),
    MembershipApplication.countDocuments(within(start, end)),
    MembershipApplication.countDocuments(within(prevStart, prevEnd)),
    MembershipApplication.countDocuments({ status: { $in: ["new", "under_review"] } }),
    MembershipApplication.countDocuments({ status: "new" }),
    EventEntry.countDocuments({ status: "upcoming" }),
    EventEntry.countDocuments({ status: "latest" }),
    Announcement.countDocuments({ published: true, startDate: { $lte: today }, endDate: { $gte: today } }),
    Announcement.countDocuments({ published: true, startDate: { $gt: today } }),
    PmesSeminar.findOne({ date: { $gte: today }, status: "open" }).sort({ date: 1 }).lean(),
    Inquiry.aggregate<{ _id: string; n: number }>(bucketed(within(start, end))),
    MembershipApplication.aggregate<{ _id: string; n: number }>(bucketed(within(start, end))),
  ]);

  const next = nextSeminarRaw as unknown as SeminarDoc | null;
  const nextApplicants = next
    ? await MembershipApplication.countDocuments({ scheduleDate: next.date, status: { $ne: "rejected" } })
    : 0;

  const inqBy = new Map(inqSeries.map((r) => [r._id, r.n]));
  const appBy = new Map(appSeries.map((r) => [r._id, r.n]));

  return {
    range: describeRange(range),
    inquiries: { open: inqOpen, received: metric(inqCur, inqPrev) },
    applications: { received: metric(appCur, appPrev), pending: appPending },
    nextSeminar: next ? seminarShape(next, nextApplicants) : null,
    events: { upcoming: eventsUpcoming, past: eventsPast },
    announcements: { active: annActive, scheduled: annScheduled },
    attention: {
      newInquiries: inqNew,
      newApplications: appNew,
      noSeminar: !next,
      noAnnouncement: annActive === 0,
    },
    series: buildBuckets(range).map((b) => ({
      key: b.key,
      label: b.label,
      future: b.future,
      inquiries: inqBy.get(b.key) ?? 0,
      applications: appBy.get(b.key) ?? 0,
    })),
  };
}

export const INQUIRY_SERVICE_LIST = INQUIRY_SERVICES;