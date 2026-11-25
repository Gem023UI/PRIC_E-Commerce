import { Schema, model } from "mongoose";

export const MOVEMENT_REASONS = ["initial", "order", "order_cancelled", "manual"] as const;

const stockMovementSchema = new Schema(
  {
    productId: { type: Number, required: true },
    delta: { type: Number, required: true },
    /** Stock after this change. */
    balance: { type: Number, required: true },
    reason: { type: String, enum: MOVEMENT_REASONS, required: true },
    note: { type: String, default: "" },
    by: { type: String, default: "" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

stockMovementSchema.index({ productId: 1, createdAt: -1 });

export const StockMovement = model("StockMovement", stockMovementSchema, "StockMovements");