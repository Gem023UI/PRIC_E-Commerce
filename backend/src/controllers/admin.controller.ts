import type { Request, RequestHandler } from "express";
import { z } from "zod";

import { getBusiness, getOverview } from "../services/stats.service";
import { RANGE_KEYS, resolveRange } from "../utils/dateRange";
import { HttpError } from "../utils/httpError";

/** ?range= one of RANGE_KEYS (defaults to last7). */
function readRange(req: Request) {
  const parsed = z.enum(RANGE_KEYS).default("last7").safeParse(req.query.range);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid range", "invalid_range", {
      range: `Use one of: ${RANGE_KEYS.join(", ")}`,
    });
  }
  return resolveRange(parsed.data);
}

export const overview: RequestHandler = async (req, res) => {
  res.json(await getOverview(readRange(req)));
};

export const business: RequestHandler = async (req, res) => {
  res.json(await getBusiness(readRange(req)));
};