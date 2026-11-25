import type { z } from "zod";

import { HttpError } from "./httpError";

export function parseQuery<S extends z.ZodType>(schema: S, query: unknown): z.output<S> {
  const parsed = schema.safeParse(query);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "query");
      if (!errors[key]) errors[key] = issue.message;
    }
    throw new HttpError(400, "Invalid request", "invalid_query", errors);
  }
  return parsed.data;
}