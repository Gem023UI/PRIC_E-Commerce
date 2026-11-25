import { Router } from "express";

import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import analyticsRoutes from "./analytics.routes";
import inquiryRoutes from "./inquiry.routes";
import orderRoutes from "./order.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/orders", orderRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);

export default router;