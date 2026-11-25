import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { z } from "zod";

import {
  getMyOrder,
  listMyOrders,
  scanOrder,
  startDelivery,
} from "../controllers/rider.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

const scanLimiter = rateLimit({
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many scan attempts. Please wait a moment." },
  windowMs: 60 * 1000,
  limit: 40,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});

const startSchema = z.object({
  packageComplete: z.literal(true, { error: "Confirm that the package is complete." }),
});
const scanSchema = z.object({
  code: z.string({ error: "Scan or enter the order code." }).min(1).max(400),
});

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.use(requireAuth, requireRole("rider"));

router.get("/orders", listMyOrders);
router.get("/orders/:id", getMyOrder);
router.post("/orders/:id/start", validate(startSchema), startDelivery);
router.post("/orders/:id/scan", scanLimiter, validate(scanSchema), scanOrder);

export default router;