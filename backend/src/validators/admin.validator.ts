import { z } from "zod";

import { emailField, mobileField, personName } from "./auth.validator";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../database/models/order.model";

export const createAccountSchema = z.object({
  firstName: personName("First name"),
  lastName: personName("Last name").optional(),
  email: emailField,
  mobile: mobileField.optional(),
  role: z.enum(["customer", "rider"], { error: "Choose an account type." }),
});
export type CreateAccountBody = z.output<typeof createAccountSchema>;

export const setStatusSchema = z.object({
  status: z.enum(["active", "deactivated"], { error: "Invalid status." }),
});
export type SetStatusBody = z.output<typeof setStatusSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { error: "Invalid status." }),
  note: z
    .string()
    .max(400, "Keep the note under 200 characters.")
    .transform((s) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim())
    .pipe(z.string().max(200, "Keep the note under 200 characters."))
    .optional(),
});
export type UpdateOrderStatusBody = z.output<typeof updateOrderStatusSchema>;

export const updatePaymentSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES, { error: "Invalid payment status." }),
});
export type UpdatePaymentBody = z.output<typeof updatePaymentSchema>;

export const assignRiderSchema = z.object({ riderId: z.string().max(40).nullable() });
export type AssignRiderBody = z.output<typeof assignRiderSchema>;