import { z } from "zod";

const normalizePath = (s: string) => {
  const bare = s.split(/[?#]/)[0] ?? "";
  const withSlash = bare.startsWith("/") ? bare : `/${bare}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") || "/" : withSlash;
};

export const visitSchema = z.object({
  path: z
    .string({ error: "Path is required." })
    .max(300, "Invalid path.")
    .transform(normalizePath)
    .pipe(
      z
        .string()
        .max(200, "Invalid path.")
        .regex(/^\/[A-Za-z0-9\-._~%/]*$/, "Invalid path."),
    ),
});