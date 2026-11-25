import { Router } from "express";

import authRoutes from "./auth.routes";
import inquiryRoutes from "./inquiry.routes";
import orderRoutes from "./order.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/orders", orderRoutes);

export default router;