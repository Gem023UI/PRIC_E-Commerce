import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: [
    "req.headers.cookie",
    'req.headers["x-internal-key"]',
    'res.headers["set-cookie"]',
  ],
});