import type { RequestHandler } from "express";

import { User, type UserRole } from "../database/models/user.model";
import { SESSION_COOKIE, verifySession } from "../services/token.service";

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

/** Use after requireAuth: router.get("/x", requireAuth, requireRole("admin"), handler) */
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  async (req, res, next) => {
    const user = await User.findById(req.auth!.userId).select("role status");
    if (!user || user.status === "deactivated") {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    if (!roles.includes((user.role ?? "customer") as UserRole)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };