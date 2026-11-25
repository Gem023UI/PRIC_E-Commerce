import { z } from "zod";

import { emailField, mobileField, personName } from "./auth.validator";

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