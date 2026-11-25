import { Router } from "express";
import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import {
  getEvent,
  listActiveAnnouncements,
  listEvents,
  listSeminars,
  submitApplication,
} from "../controllers/publicEngagement.controller";
import { validate } from "../middlewares/validate.middleware";
import { membershipApplicationSchema } from "../validators/membership.validator";

const base = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? ""),
};

const readLimiter = rateLimit({
  ...base,
  message: { message: "Too many requests." },
  windowMs: 60 * 1000,
  limit: 120,
});

const applyLimiter = rateLimit({
  ...base,
  message: { message: "Too many applications. Please try again later." },
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/events", readLimiter, listEvents);
router.get("/events/:id", readLimiter, getEvent);
router.get("/announcements/active", readLimiter, listActiveAnnouncements);
router.get("/membership/seminars", readLimiter, listSeminars);
router.post(
  "/membership/applications",
  applyLimiter,
  validate(membershipApplicationSchema),
  submitApplication,
);

export default router;