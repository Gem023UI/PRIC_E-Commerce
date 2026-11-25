export type Seminar = {
  id: string;
  /** YYYY-MM-DD, always a Saturday. */
  date: string;
  startTime: string;
  venue: string;
  note: string;
  status: "open" | "closed";
  applicants: number;
};

export type SeminarInfo = {
  /** Today's date in Philippine time. */
  today: string;
  next: Seminar | null;
  upcoming: Seminar[];
  /** Used by the form while no seminar is scheduled. */
  fallbackSaturdays: string[];
};