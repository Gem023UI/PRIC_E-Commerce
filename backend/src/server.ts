import app from "./app";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./database/connection";
import { logger } from "./utils/logger";

async function main() {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`API listening on :${env.PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error({ err }, "Failed to start");
  process.exit(1);
});