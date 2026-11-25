import type { Request } from "express";
import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import {
  clearSession,
  createOrder,
  getSession,
  listOrders,
  sendOtp,
  verifyOtp,
} from "../controllers/order.controller";
import { requireGuest } from "../middlewares/guestAuth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { otpRequestSchema, otpVerifySchema } from "../validators/inquiry.validator";
import { createOrderSchema } from "../validators/order.validator";

const base = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
};
const byIp = (req: Request) => ipKeyGenerator(req.ip ?? "");
const byIpAndEmail = (req: Request) =>
  `${byIp(req)}:${String(req.body?.email ?? "").toLowerCase()}`;

const HOUR = 60 * 60 * 1000;
const FIFTEEN_MIN = 15 * 60 * 1000;

const otpIpLimiter = rateLimit({ ...base, windowMs: HOUR, limit: 20, keyGenerator: byIp });
const otpEmailLimiter = rateLimit({ ...base, windowMs: HOUR, limit: 5, keyGenerator: byIpAndEmail });
const verifyLimiter = rateLimit({ ...base, windowMs: FIFTEEN_MIN, limit: 20, keyGenerator: byIpAndEmail });
const submitLimiter = rateLimit({ ...base, windowMs: HOUR, limit: 10, keyGenerator: byIp });
const readLimiter = rateLimit({ ...base, windowMs: FIFTEEN_MIN, limit: 120, keyGenerator: byIp });

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.post("/otp", otpIpLimiter, validate(otpRequestSchema), otpEmailLimiter, sendOtp);
router.post("/otp/verify", validate(otpVerifySchema), verifyLimiter, verifyOtp);
router.get("/session", readLimiter, getSession);
router.post("/session/clear", readLimiter, clearSession);
router.get("/", readLimiter, requireGuest, listOrders);
router.post("/", submitLimiter, validate(createOrderSchema), requireGuest, createOrder);

export default router;