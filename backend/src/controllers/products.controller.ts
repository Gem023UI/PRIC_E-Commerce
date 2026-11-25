import type { RequestHandler } from "express";

import { listPublicProducts } from "../services/products.service";

export const listProducts: RequestHandler = async (_req, res) => {
  res.json({ products: await listPublicProducts() });
};