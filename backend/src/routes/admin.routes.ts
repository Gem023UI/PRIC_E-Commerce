import { Router } from "express";

import { business, overview } from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Everything under /api/admin is for administrators only.
router.use(requireAuth, requireRole("admin"));

router.get("/stats/overview", overview);
router.get("/stats/business", business);

export default router;