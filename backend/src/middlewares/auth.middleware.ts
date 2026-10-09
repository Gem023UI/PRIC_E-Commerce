import type { RequestHandler } from "express";

import { SESSION_COOKIE, verifySession } from "../../services/token.service";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  const session = typeof token === "string" ? await verifySession(token) : null;
  if (!session) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  req.auth = session;
  next();
};