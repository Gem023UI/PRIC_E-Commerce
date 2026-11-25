import { z } from "zod";

/* eslint-disable no-control-regex */
const clean = (s: string) =>
  s.replace(/[\u0000-\u001F\u007F<>]/g, "").replace(/\s+/g, " ").trim();
/* eslint-enable no-control-regex */

const image = z
  .string()
  .max(500, "Image link is too long.")
  .transform((s) => s.trim())
  .pipe(
    z
      .string()
      .regex(
        /^(https:\/\/[^\s"'<>]+|\/[A-Za-z0-9\-._~%/]+)$/,
        "Use an https:// image link or a /path from the site.",
      ),
  );

export const createProductSchema = z.object({
  name: z
    .string({ error: "Name is required." })
    .max(240, "Name is too long.")
    .transform(clean)
    .pipe(z.string().min(2, "Name is too short.").max(120, "Name is too long.")),
  description: z
    .string()
    .max(1200, "Keep the description under 600 characters.")
    .transform(clean)
    .pipe(z.string().max(600, "Keep the description under 600 characters."))
    .optional(),
  image: image.optional(),
  price: z
    .number({ error: "Enter a price." })
    .min(0, "Price can't be negative.")
    .max(1_000_000, "Price is too high."),
  stock: z
    .number({ error: "Enter the starting stock." })
    .int("Use a whole number.")
    .min(0, "Stock can't be negative.")
    .max(1_000_000, "Stock is too high."),
  lowStockThreshold: z
    .number({ error: "Enter a low-stock level." })
    .int("Use a whole number.")
    .min(0, "Can't be negative.")
    .max(100_000, "Too high."),
  published: z.boolean({ error: "Choose whether the product is visible." }),
});
export type CreateProductBody = z.output<typeof createProductSchema>;

export const updateProductSchema = createProductSchema
  .omit({ stock: true })
  .partial()
  .refine((o) => Object.keys(o).length > 0, "Nothing to update.");
export type UpdateProductBody = z.output<typeof updateProductSchema>;

export const stockAdjustSchema = z
  .object({
    mode: z.enum(["add", "remove", "set"], { error: "Choose what to do with the stock." }),
    quantity: z
      .number({ error: "Enter a quantity." })
      .int("Use a whole number.")
      .min(0, "Can't be negative.")
      .max(1_000_000, "Too high."),
    note: z
      .string()
      .max(400)
      .transform(clean)
      .pipe(z.string().max(200, "Keep the note under 200 characters."))
      .optional(),
  })
  .refine((d) => d.mode === "set" || d.quantity >= 1, {
    path: ["quantity"],
    message: "Enter at least 1.",
  });
export type StockAdjustBody = z.output<typeof stockAdjustSchema>;