import type { ErrorRequestHandler, RequestHandler } from "express";

import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({ message: err.message, code: err.code, errors: err.errors });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON body" });
    return;
  }
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
};