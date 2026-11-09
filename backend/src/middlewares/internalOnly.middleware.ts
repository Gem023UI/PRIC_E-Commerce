import type { RequestHandler } from "express";

import { env } from "../config/env";
import { safeEqual } from "../utils/crypto";
import { logger } from "../utils/logger";

export const internalOnly: RequestHandler = (req, res, next) => {
  const key = req.get("x-internal-key") ?? "";

  if (!key) {
    logger.warn(
      {
        method: req.method,
        path: req.originalUrl,
      },
      "Internal API request rejected: missing x-internal-key header"
    );

    res.status(404).json({ message: "Not found" });
    return;
  }

  if (!safeEqual(key, env.INTERNAL_API_KEY)) {
    logger.error(
      {
        method: req.method,
        path: req.originalUrl,
        providedKeyLength: key.length,
        configuredKeyLength: env.INTERNAL_API_KEY.length,
      },
      "Internal API request rejected: API key mismatch"
    );

    res.status(404).json({ message: "Not found" });
    return;
  }

  logger.debug(
    {
      method: req.method,
      path: req.originalUrl,
    },
    "Internal API authentication successful"
  );

  next();
};