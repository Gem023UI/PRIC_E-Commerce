import { type InferSchemaType, Schema, type Types, model } from "mongoose";

const productSchema = new Schema(
  {
    /** The public numeric id (kept so existing carts and orders keep working). */
    productId: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", trim: true, maxlength: 600 },
    image: { type: String, default: "/products.png", maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 10 },
    published: { type: Boolean, default: true },
    /** Soft delete: past orders and analytics keep working. */
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productSchema.index({ deletedAt: 1, published: 1 });

export type ProductRecord = InferSchemaType<typeof productSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Product = model("Product", productSchema, "Products");