import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { trackVisit } from "../controllers/analytics.controller";
import { validate } from "../middlewares/validate.middleware";
import { visitSchema } from "../validators/analytics.validator";

const visitLimiter = rateLimit({
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests." },
  windowMs: 60 * 1000,
  limit: 60,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});

const router: Router = Router();

router.post("/visit", visitLimiter, validate(visitSchema), trackVisit);

export default router;