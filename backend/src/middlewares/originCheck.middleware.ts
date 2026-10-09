import type { RequestHandler } from "express";

import { env } from "../config/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** CSRF defence on top of SameSite=Lax: state-changing requests must come from our frontend. */
export const originCheck: RequestHandler = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get("origin") !== env.FRONTEND_URL) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
};