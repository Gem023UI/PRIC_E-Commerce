import type { Request } from "express";
import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { createInquiry, sendOtp, verifyOtp } from "../controllers/inquiry.controller";
import { validate } from "../middlewares/validate.middleware";
import {
  createInquirySchema,
  otpRequestSchema,
  otpVerifySchema,
} from "../validators/inquiry.validator";

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

const router: Router = Router();

router.post("/otp", otpIpLimiter, validate(otpRequestSchema), otpEmailLimiter, sendOtp);
router.post("/otp/verify", validate(otpVerifySchema), verifyLimiter, verifyOtp);
router.post("/", submitLimiter, validate(createInquirySchema), createInquiry);

export default router;