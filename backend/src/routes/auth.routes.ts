import { Router } from "express";

import {
  login,
  logout,
  me,
  resendVerification,
  setPassword,
  verifyEmail,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  emailLimiter,
  loginAccountLimiter,
  loginIpLimiter,
  setPasswordLimiter,
} from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  emailOnlySchema,
  loginSchema,
  setPasswordSchema,
} from "../validators/auth.validator";

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.post(
  "/login",
  loginIpLimiter,
  loginAccountLimiter,
  validate(loginSchema),
  login,
);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.get("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  emailLimiter,
  validate(emailOnlySchema),
  resendVerification,
);
router.post(
  "/set-password",
  setPasswordLimiter,
  validate(setPasswordSchema),
  setPassword,
);

export default router;