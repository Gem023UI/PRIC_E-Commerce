import type { Metric, RangeInfo } from "@/lib/admin-stats";
import type { Seminar } from "@/lib/seminars";

/* ---------------------------------- inquiries ---------------------------------- */

export type InquiryStatus = "new" | "contacted" | "closed";

export type InquiryRow = {
  id: string;
  service: string;
  serviceLabel: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: InquiryStatus;
  createdAt: string;
};

export type InquiryList = {
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  counts: { all: number; open: number } & Record<InquiryStatus, number>;
  inquiries: InquiryRow[];
};

/* --------------------------------- applications --------------------------------- */

export type ApplicationStatus = "new" | "under_review" | "approved" | "rejected";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

export type ApplicationRow = {
  id: string;
  reference: string;
  name: string;
  category: string;
  phone: string;
  scheduleDate: string;
  status: ApplicationStatus;
  createdAt: string;
};

export type ApplicationList = {
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  counts: { all: number } & Record<ApplicationStatus, number>;
  applications: ApplicationRow[];
};

export type ApplicationDetail = {
  id: string;
  reference: string;
  status: ApplicationStatus;
  statusNote: string;
  statusUpdatedAt: string | null;
  reviewedBy: string;
  createdAt: string;
  membershipCategory: string;
  lastName: string;
  firstName: string;
  middleName: string;
  address: string;
  birthDate: string;
  birthPlace: string;
  civilStatus: string;
  sex: string;
  nationality: string;
  phone: string;
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
  scheduleDate: string;
  signatureName: string;
  signatureImage: string;
};

/* ----------------------------------- seminars ----------------------------------- */

export type SeminarRow = Seminar;

export type SeminarList = {
  upcoming: SeminarRow[];
  past: SeminarRow[];
  requestedDates: { date: string; applicants: number }[];
};

/* ------------------------------ events & announcements ------------------------------ */

export type AdminEvent = {
  id: number;
  status: "upcoming" | "latest";
  title: string;
  location: string;
  dateLabel: string;
  /** YYYY-MM-DD or "". */
  sortDate: string;
  time: string;
  description: string;
  images: string[];
  updatedAt: string;
};

export type AnnouncementState = "active" | "scheduled" | "expired" | "hidden";

export type AdminAnnouncement = {
  id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  published: boolean;
  state: AnnouncementState;
};

/* ----------------------------------- stats ----------------------------------- */

export type EngagementStats = {
  range: RangeInfo;
  inquiries: { open: number; received: Metric };
  applications: { received: Metric; pending: number };
  nextSeminar: SeminarRow | null;
  events: { upcoming: number; past: number };
  announcements: { active: number; scheduled: number };
  attention: {
    newInquiries: number;
    newApplications: number;
    noSeminar: boolean;
    noAnnouncement: boolean;
  };
  series: { key: string; label: string; future: boolean; inquiries: number; applications: number }[];
};

export type Tab = "inquiries" | "membership" | "events" | "announcements";