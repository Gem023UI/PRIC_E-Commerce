import type { Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

const base = {
  standardHeaders: "draft-8" as const,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
};

const byIp = (req: Request) => ipKeyGenerator(req.ip ?? "");
const byIpAndEmail = (req: Request) =>
  `${byIp(req)}:${String(req.body?.email ?? "").toLowerCase()}`;

const FIFTEEN_MIN = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export const loginIpLimiter = rateLimit({
  ...base,
  windowMs: FIFTEEN_MIN,
  limit: 30,
  keyGenerator: byIp,
});

export const loginAccountLimiter = rateLimit({
  ...base,
  windowMs: FIFTEEN_MIN,
  limit: 8,
  keyGenerator: byIpAndEmail,
});

export const registerLimiter = rateLimit({
  ...base,
  windowMs: ONE_HOUR,
  limit: 10,
  keyGenerator: byIp,
});

export const emailLimiter = rateLimit({
  ...base,
  windowMs: ONE_HOUR,
  limit: 5,
  keyGenerator: byIpAndEmail,
});