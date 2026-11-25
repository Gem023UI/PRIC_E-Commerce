import type { Request, RequestHandler } from "express";
import { z } from "zod";

import { Product } from "../database/models/product.model";
import { StockMovement } from "../database/models/stockMovement.model";
import { User } from "../database/models/user.model";
import { signUpload as signCloudinary, uploadsConfigured } from "../services/cloudinary.service";
import {
  adjustStock as adjustProductStock,
  getInventoryStats,
  getProductDetail,
  listAdminProducts,
} from "../services/inventory.service";
import { round2 } from "../services/stats.service";
import { RANGE_KEYS, resolveRange } from "../utils/dateRange";
import { HttpError } from "../utils/httpError";
import type {
  CreateProductBody,
  StockAdjustBody,
  UpdateProductBody,
} from "../validators/product.validator";

const PLACEHOLDER_IMAGE = "/products.png";

const rangeQuery = z.object({ range: z.enum(RANGE_KEYS).default("last7") });

function productIdOf(raw: unknown) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(404, "Product not found");
  return id;
}

async function adminName(req: Request) {
  const u = await User.findById(req.auth!.userId).select("firstName lastName");
  return u ? `${u.firstName} ${u.lastName ?? ""}`.trim() : "Admin";
}

async function respondWithProduct(res: Parameters<RequestHandler>[1], id: number, status = 200) {
  const detail = await getProductDetail(id);
  if (!detail) throw new HttpError(404, "Product not found");
  res.status(status).json(detail);
}

export const inventoryStats: RequestHandler = async (req, res) => {
  const parsed = rangeQuery.safeParse(req.query);
  if (!parsed.success) {
    throw new HttpError(400, "Invalid range", "invalid_range", {
      range: `Use one of: ${RANGE_KEYS.join(", ")}`,
    });
  }
  res.json(await getInventoryStats(resolveRange(parsed.data.range)));
};

export const productList: RequestHandler = async (_req, res) => {
  res.json({ products: await listAdminProducts() });
};

export const productDetail: RequestHandler = async (req, res) => {
  await respondWithProduct(res, productIdOf(req.params.id));
};

export const createProduct: RequestHandler = async (req, res) => {
  const body = req.body as CreateProductBody;

  // Ids are never reused, so soft-deleted products still count when picking the next one.
  let created;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    const top = await Product.findOne().sort({ productId: -1 }).select("productId").lean();
    try {
      created = await Product.create({
        productId: (top?.productId ?? 0) + 1,
        name: body.name,
        description: body.description ?? "",
        image: body.image ?? PLACEHOLDER_IMAGE,
        price: round2(body.price),
        stock: body.stock,
        lowStockThreshold: body.lowStockThreshold,
        published: body.published,
      });
    } catch (err) {
      if ((err as { code?: number }).code !== 11000) throw err; // only retry id collisions
    }
  }
  if (!created) throw new HttpError(500, "Could not create the product. Please try again.");

  if (body.stock > 0) {
    await StockMovement.create({
      productId: created.productId,
      delta: body.stock,
      balance: body.stock,
      reason: "initial",
      note: "Starting stock",
      by: await adminName(req),
    });
  }

  await respondWithProduct(res, created.productId, 201);
};

export const updateProduct: RequestHandler = async (req, res) => {
  const id = productIdOf(req.params.id);
  const body = req.body as UpdateProductBody;

  const product = await Product.findOne({ productId: id, deletedAt: null });
  if (!product) throw new HttpError(404, "Product not found");

  if (body.name !== undefined) product.name = body.name;
  if (body.description !== undefined) product.description = body.description;
  if (body.image !== undefined) product.image = body.image;
  if (body.price !== undefined) product.price = round2(body.price);
  if (body.lowStockThreshold !== undefined) product.lowStockThreshold = body.lowStockThreshold;
  if (body.published !== undefined) product.published = body.published;
  await product.save();

  await respondWithProduct(res, id);
};

export const adjustStock: RequestHandler = async (req, res) => {
  const id = productIdOf(req.params.id);
  const { mode, quantity, note } = req.body as StockAdjustBody;
  await adjustProductStock(id, mode, quantity, note ?? "", await adminName(req));
  await respondWithProduct(res, id);
};

export const deleteProduct: RequestHandler = async (req, res) => {
  const id = productIdOf(req.params.id);
  const result = await Product.updateOne(
    { productId: id, deletedAt: null },
    { $set: { deletedAt: new Date(), published: false } },
  );
  if (result.matchedCount === 0) throw new HttpError(404, "Product not found");
  res.json({ ok: true });
};

export const signUpload: RequestHandler = (_req, res) => {
  if (!uploadsConfigured()) {
    throw new HttpError(
      503,
      "Image uploads aren't set up on this server. Paste an image link instead.",
      "uploads_disabled",
    );
  }
  res.json(signCloudinary());
};