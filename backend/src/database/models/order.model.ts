import { type InferSchemaType, Schema, type Types, model } from "mongoose";

export const ORDER_STATUSES = [
  "to_confirm",
  "to_ship",
  "on_delivery",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Lower number = shown first in the order history. */
export const ORDER_STATUS_PRIORITY: Record<OrderStatus, number> = {
  on_delivery: 0,
  to_ship: 1,
  to_confirm: 2,
  completed: 3,
  cancelled: 4,
};

export const PAYMENT_METHODS = ["cod", "gcash", "paymaya", "bank"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  gcash: "GCash",
  paymaya: "PayMaya",
  bank: "Bank Transfer",
};

export const PAYMENT_STATUSES = ["unpaid", "pending_verification", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const itemSchema = new Schema(
  {
    productId: { type: Number, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    barangay: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    postalCode: { type: String, default: "" },
    landmark: { type: String, default: "" },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    trackingCode: { type: String, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true },
    address: { type: addressSchema, required: true },
    items: {
      type: [itemSchema],
      required: true,
      validate: (v: unknown[]) => v.length > 0,
    },
    itemCount: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid", index: true },
    status: { type: String, enum: ORDER_STATUSES, default: "to_confirm", index: true },
    notes: { type: String, default: "" },
    // Adjustments: no UI for these yet, so they stay 0 (shown as PHP 0.00 in Business Performance).
    discountTotal: { type: Number, default: 0, min: 0 },
    refundedAmount: { type: Number, default: 0, min: 0 },
    // Delivery assignment (set from Order management, used by the rider pages).
    rider: { type: Schema.Types.ObjectId, ref: "User", default: null },
    riderAssignedAt: { type: Date, default: null },
    // Lifecycle timestamps (set by the app when the status changes).
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    deliveryStartedAt: { type: Date, default: null },
    cancelReason: { type: String, default: "" },
    statusHistory: { type: [historySchema], default: [] },
    confirmationEmailedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ email: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, completedAt: 1 });
orderSchema.index({ rider: 1, status: 1 });

export type OrderRecord = InferSchemaType<typeof orderSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Order = model("Order", orderSchema, "Orders");