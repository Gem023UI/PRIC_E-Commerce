import { Router } from "express";

import {
  login,
  logout,
  me,
  oauthCallback,
  oauthStart,
  register,
  resendVerification,
  verifyEmail,
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import {
  emailLimiter,
  loginAccountLimiter,
  loginIpLimiter,
  registerLimiter,
} from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  emailOnlySchema,
  loginSchema,
  registerSchema,
} from "../validators/auth.validator";

const router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.post("/register", registerLimiter, validate(registerSchema), register);
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

// Keep these last: `:provider` would otherwise swallow the static routes.
router.get("/:provider", oauthStart);
router.get("/:provider/callback", oauthCallback);

export default router;