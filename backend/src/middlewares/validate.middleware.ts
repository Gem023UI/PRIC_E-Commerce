import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!errors[key]) errors[key] = issue.message;
      }
      res.status(400).json({ message: "Validation failed", errors });
      return;
    }
    req.body = parsed.data;
    next();
  };