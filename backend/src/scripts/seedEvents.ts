import { readFileSync } from "node:fs";

import { connectDatabase, disconnectDatabase } from "../database/connection";
import { EventEntry } from "../database/models/event.model";

const PLACEHOLDER =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

type SourceEvent = {
  id: number;
  status: "upcoming" | "latest";
  title: string;
  location: string;
  date: string;
  time?: string;
  description: string;
  images?: string[];
};

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/** Best-effort date for ordering, e.g. "March 28 – April 3, 2022" -> 2022-03-28, "April 2023" -> 2023-04-01. */
function parseSortDate(label: string): Date | null {
  const year = label.match(/\b(?:19|20)\d{2}\b/)?.[0];
  if (!year) return null;
  const m = label.toLowerCase().match(new RegExp(`\\b(${MONTHS.join("|")})\\b(?:\\s+(\\d{1,2})(?!\\d))?`));
  if (!m) return null;
  const month = MONTHS.indexOf(m[1] as string);
  const day = Math.min(Math.max(Number(m[2] ?? 1), 1), 31);
  return new Date(Date.UTC(Number(year), month, day) - 8 * 3_600_000); // midnight Philippine time
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: pnpm seed:events <path-to-events-export.json>");
    process.exit(1);
  }

  const source = JSON.parse(readFileSync(file, "utf8")) as SourceEvent[];
  if (!Array.isArray(source)) {
    console.error("That file doesn't contain a list of events.");
    process.exit(1);
  }

  await connectDatabase();

  // Existing events are never overwritten, so this is safe to rerun.
  let created = 0;
  for (const e of source) {
    const res = await EventEntry.updateOne(
      { eventId: e.id },
      {
        $setOnInsert: {
          eventId: e.id,
          status: e.status,
          title: e.title,
          location: e.location,
          dateLabel: e.date,
          sortDate: parseSortDate(e.date),
          time: e.time || "Time not specified",
          description: e.description,
          images: (e.images ?? []).filter((u) => u && u !== PLACEHOLDER),
        },
      },
      { upsert: true },
    );
    if (res.upsertedCount) created++;
  }
  console.log(`Events: ${created} added, ${source.length - created} already existed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());