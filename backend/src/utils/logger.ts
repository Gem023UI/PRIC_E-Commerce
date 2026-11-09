import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: isDevelopment ? "debug" : "info",

  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "req.headers.x-internal-key",
      "res.headers.set-cookie",
    ],
    censor: "[REDACTED]",
  },

  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  }),
});