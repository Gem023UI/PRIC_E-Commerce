import type { RequestHandler } from "express";

import { MembershipApplication } from "../database/models/membership.model";
import { PmesSeminar } from "../database/models/pmesSeminar.model";
import {
  activeAnnouncements,
  applicationReference,
  publicEvent,
  publicEvents,
  publicSeminars,
} from "../services/engagement.service";
import { HttpError } from "../utils/httpError";
import type { MembershipApplicationBody } from "../validators/membership.validator";

const defined = (o?: Record<string, string | undefined>): Record<string, string> =>
  Object.fromEntries(Object.entries(o ?? {}).filter((e): e is [string, string] => e[1] !== undefined));

export const listEvents: RequestHandler = async (_req, res) => {
  res.json({ events: await publicEvents() });
};

export const getEvent: RequestHandler = async (req, res) => {
  const id = Number(req.params.id);
  const event = Number.isInteger(id) ? await publicEvent(id) : null;
  if (!event) throw new HttpError(404, "Event not found");
  res.json({ event });
};

export const listActiveAnnouncements: RequestHandler = async (_req, res) => {
  res.json({ announcements: await activeAnnouncements() });
};

export const listSeminars: RequestHandler = async (_req, res) => {
  res.json(await publicSeminars());
};

export const submitApplication: RequestHandler = async (req, res) => {
  const b = req.body as MembershipApplicationBody;

  // A seminar the cooperative closed isn't accepting applicants.
  const seminar = await PmesSeminar.findOne({ date: b.scheduleDate }).select("status");
  if (seminar?.status === "closed") {
    throw new HttpError(409, "That seminar is no longer accepting applicants.", "seminar_closed", {
      scheduleDate: "That seminar is no longer accepting applicants. Please choose another Saturday.",
    });
  }

  const dedupeKey = [b.lastName, b.firstName, b.birthDate].join("|").toLowerCase();
  const pending = await MembershipApplication.exists({
    dedupeKey,
    status: { $in: ["new", "under_review"] },
  });
  if (pending) {
    throw new HttpError(
      409,
      "We already have a pending application for this person. The cooperative will contact you soon.",
      "duplicate_application",
    );
  }

  
  const doc = await MembershipApplication.create({
    membershipCategory: b.membershipCategory,
    lastName: b.lastName,
    firstName: b.firstName,

    ...(b.middleName !== undefined && {
      middleName: b.middleName,
    }),

    address: b.address,
    birthDate: b.birthDate,
    birthPlace: b.birthPlace,
    civilStatus: b.civilStatus,
    sex: b.sex,
    nationality: b.nationality,
    phone: b.phone,

    ...(b.religion !== undefined && { religion: b.religion }),
    ...(b.weight !== undefined && { weight: b.weight }),
    ...(b.height !== undefined && { height: b.height }),
    ...(b.occupation !== undefined && { occupation: b.occupation }),

    ...(b.motherName !== undefined && { motherName: b.motherName }),
    ...(b.motherOccupation !== undefined && {
      motherOccupation: b.motherOccupation,
    }),
    ...(b.fatherName !== undefined && { fatherName: b.fatherName }),
    ...(b.fatherOccupation !== undefined && {
      fatherOccupation: b.fatherOccupation,
    }),
    ...(b.spouseName !== undefined && { spouseName: b.spouseName }),
    ...(b.spouseOccupation !== undefined && {
      spouseOccupation: b.spouseOccupation,
    }),

    beneficiaries: b.beneficiaries,

    education: {
      college: defined(b.education.college),
      vocational: defined(b.education.vocational),
      secondary: defined(b.education.secondary),
      elementary: defined(b.education.elementary),
    },

    ids: defined(b.ids),

    scheduleDate: b.scheduleDate,
    signatureName: b.signatureName,
    signatureImage: b.signatureImage ?? "",
    dedupeKey,
  });

  res.status(201).json({
    id: String(doc._id),
    reference: applicationReference(doc._id),
  });


  res.status(201).json({ id: String(doc._id), reference: applicationReference(doc._id) });
};