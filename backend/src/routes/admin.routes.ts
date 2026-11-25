import { Router } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";

import { business, overview } from "../controllers/admin.controller";
import {
  announcementCreate,
  announcementDelete,
  announcementUpdate,
  announcementsList,
  applicationDetail,
  applicationStatus,
  applicationsList,
  engagementStats,
  eventCreate,
  eventDelete,
  eventUpdate,
  eventsList,
  inquiriesList,
  inquiryStatus,
  seminarCreate,
  seminarDelete,
  seminarUpdate,
  seminarsList,
} from "../controllers/adminEngagement.controller";
import {
  adjustStock,
  createProduct,
  deleteProduct,
  inventoryStats,
  productDetail,
  productList,
  signUpload,
  updateProduct,
} from "../controllers/adminProducts.controller";
import {
  assignRider,
  orderDetail,
  orderList,
  orderStats,
  riderList,
  updatePayment,
  updateStatus as updateOrderStatus,
} from "../controllers/orders.controller";
import {
  createAccount,
  customerDetail,
  customerList,
  customerStats,
  resendInvite,
  setStatus,
} from "../controllers/customers.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";
import {
  createProductSchema,
  stockAdjustSchema,
  updateProductSchema,
} from "../validators/product.validator";
import { validate } from "../middlewares/validate.middleware";
import {
  announcementCreateSchema,
  announcementUpdateSchema,
  applicationStatusSchema,
  eventSchema,
  eventUpdateSchema,
  inquiryStatusSchema,
  seminarSchema,
  seminarUpdateSchema,
} from "../validators/engagement.validator";
import {
  assignRiderSchema,
  createAccountSchema,
  setStatusSchema,
  updateOrderStatusSchema,
  updatePaymentSchema,
} from "../validators/admin.validator";

const inviteLimiter = rateLimit({
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many invitations. Please try again later." },
  windowMs: 60 * 60 * 1000,
  limit: 40,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
});

const router: Router = Router();

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Everything under /api/admin is for administrators only.
router.use(requireAuth, requireRole("admin"));

router.get("/stats/overview", overview);
router.get("/stats/business", business);

router.get("/customers/stats", customerStats);
router.get("/customers/detail", customerDetail);
router.get("/customers", customerList);

router.post("/users", inviteLimiter, validate(createAccountSchema), createAccount);
router.post("/users/:id/resend-invite", inviteLimiter, resendInvite);
router.patch("/users/:id/status", validate(setStatusSchema), setStatus);

router.get("/orders/stats", orderStats);
router.get("/orders", orderList);
router.get("/orders/:id", orderDetail);
router.post("/orders/:id/status", validate(updateOrderStatusSchema), updateOrderStatus);
router.post("/orders/:id/payment", validate(updatePaymentSchema), updatePayment);
router.post("/orders/:id/rider", validate(assignRiderSchema), assignRider);
router.get("/riders", riderList);

router.get("/products/stats", inventoryStats);
router.get("/products", productList);
router.post("/products", validate(createProductSchema), createProduct);
router.get("/products/:id", productDetail);
router.patch("/products/:id", validate(updateProductSchema), updateProduct);
router.post("/products/:id/stock", validate(stockAdjustSchema), adjustStock);
router.delete("/products/:id", deleteProduct);
router.post("/uploads/sign", signUpload);

router.get("/engagement/stats", engagementStats);

router.get("/inquiries", inquiriesList);
router.patch("/inquiries/:id/status", validate(inquiryStatusSchema), inquiryStatus);

router.get("/applications", applicationsList);+router.get("/applications/:id", applicationDetail);
router.patch("/applications/:id/status", validate(applicationStatusSchema), applicationStatus);

router.get("/seminars", seminarsList);
router.post("/seminars", validate(seminarSchema), seminarCreate);
router.patch("/seminars/:id", validate(seminarUpdateSchema), seminarUpdate);
router.delete("/seminars/:id", seminarDelete);

router.get("/events", eventsList);
router.post("/events", validate(eventSchema), eventCreate);
router.patch("/events/:id", validate(eventUpdateSchema), eventUpdate);
router.delete("/events/:id", eventDelete);

router.get("/announcements", announcementsList);
router.post("/announcements", validate(announcementCreateSchema), announcementCreate);
router.patch("/announcements/:id", validate(announcementUpdateSchema), announcementUpdate);
router.delete("/announcements/:id", announcementDelete);

export default router;