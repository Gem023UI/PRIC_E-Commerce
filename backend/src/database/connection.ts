import mongoose from "mongoose";

import { env } from "../config/env";
import { logger } from "../utils/logger";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: true });
  logger.info("MongoDB connected");
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}