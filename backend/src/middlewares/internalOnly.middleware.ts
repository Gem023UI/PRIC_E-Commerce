import type { RequestHandler } from "express";

import { env } from "../config/env";
import { safeEqual } from "../utils/crypto";

/** Only the Next.js proxy knows the key, so the API can't be hit directly. */
export const internalOnly: RequestHandler = (req, res, next) => {
  const key = req.get("x-internal-key") ?? "";
  if (!safeEqual(key, env.INTERNAL_API_KEY)) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
};