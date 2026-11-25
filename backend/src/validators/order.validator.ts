import { z } from "zod";

import { PAYMENT_METHODS } from "../database/models/order.model";
import { createInquirySchema } from "./inquiry.validator";

const { email, fullName, phone } = createInquirySchema.shape;

/* eslint-disable no-control-regex */
const clean = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
/* eslint-enable no-control-regex */

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .max(max * 2, `${label} is too long.`)
    .transform(clean)
    .pipe(
      z
        .string()
        .min(min, `${label} is required.`)
        .max(max, `${label} is too long.`),
    );

const optionalText = (max: number) =>
  z.string().max(max * 2).transform(clean).pipe(z.string().max(max)).optional();

const address = z.object({
  street: text("Street address", 5, 150),
  barangay: text("Barangay", 2, 80),
  city: text("City or municipality", 2, 80),
  province: text("Province or region", 2, 80),
  postalCode: z.string().regex(/^\d{4}$/, "Enter a 4-digit postal code.").optional(),
  landmark: optionalText(150),
  lat: z
    .number({ error: "Pin your location on the map." })
    .min(4, "Pin must be within the Philippines.")
    .max(22, "Pin must be within the Philippines."),
  lng: z
    .number({ error: "Pin your location on the map." })
    .min(116, "Pin must be within the Philippines.")
    .max(128, "Pin must be within the Philippines."),
});

export const createOrderSchema = z.object({
  email,
  fullName,
  phone,
  address,
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(20, "Too many items in one order."),
  paymentMethod: z.enum(PAYMENT_METHODS, { error: "Choose a payment method." }),
  notes: optionalText(300),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;