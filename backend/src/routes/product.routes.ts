import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { listProducts } from "../controllers/products.controller";

const limiter = rateLimit({
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests." },
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.get("/", limiter, listProducts);

export default router;