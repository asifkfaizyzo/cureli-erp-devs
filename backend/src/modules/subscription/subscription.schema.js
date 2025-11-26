import { z } from "zod";

export const selectPlanSchema = z.object({
  plan_id: z.string().uuid("Invalid plan"),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
});

