import { Router } from "express";

import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import analyticsRoutes from "./analytics.routes";
import engagementRoutes from "./engagement.routes";
import inquiryRoutes from "./inquiry.routes";
import orderRoutes from "./order.routes";
import productRoutes from "./product.routes";
import riderRoutes from "./rider.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/orders", orderRoutes);
router.use("/products", productRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);
router.use("/rider", riderRoutes);
router.use(engagementRoutes);

export default router;