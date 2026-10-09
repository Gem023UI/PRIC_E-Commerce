import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { errorHandler, notFound } from "./middlewares/error.middleware";
import { internalOnly } from "./middlewares/internalOnly.middleware";
import { originCheck } from "./middlewares/originCheck.middleware";
import apiRouter from "./routes";
import { logger } from "./utils/logger";

const app = express();

app.set("trust proxy", 1); // the Next.js proxy is the only hop
app.disable("x-powered-by");

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(compression());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", internalOnly, originCheck);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;