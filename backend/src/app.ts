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

const app: express.Application = express();

app.set("trust proxy", 1); // the Next.js proxy is the only hop
app.disable("x-powered-by");

app.use(
  pinoHttp({
    logger,

    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
        };
      },

      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },

    customLogLevel(_req, res, err) {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },

    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} completed with ${res.statusCode}`;
    },

    customErrorMessage(req, res, err) {
      return `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`;
    },
  })
);

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