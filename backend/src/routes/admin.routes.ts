import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { business, overview } from "../controllers/admin.controller";
import {
  createAccount,
  customerDetail,
  customerList,
  customerStats,
  resendInvite,
  setStatus,
} from "../controllers/customers.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createAccountSchema, setStatusSchema } from "../validators/admin.validator";

const inviteLimiter = rateLimit({
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many invitations. Please try again later." },
  windowMs: 60 * 60 * 1000,
  limit: 40,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Everything under /api/admin is for administrators only.
router.use(requireAuth, requireRole("admin"));

router.get("/stats/overview", overview);
router.get("/stats/business", business);

router.get("/customers/stats", customerStats);
router.get("/customers/detail", customerDetail);
router.get("/customers", customerList);

router.post("/users", inviteLimiter, validate(createAccountSchema), createAccount);
router.post("/users/:id/resend-invite", inviteLimiter, resendInvite);
router.patch("/users/:id/status", validate(setStatusSchema), setStatus);

export default router;