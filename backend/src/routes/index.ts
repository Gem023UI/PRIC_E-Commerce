import { Router } from "express";

import authRoutes from "./auth.routes";
import inquiryRoutes from "./inquiry.routes";

const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/inquiries", inquiryRoutes);

export default router;