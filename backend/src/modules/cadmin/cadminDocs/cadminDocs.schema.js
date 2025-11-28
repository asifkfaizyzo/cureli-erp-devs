import { z } from "zod";

export const rejectSchema = z.object({
  reason: z.string().min(3, "Provide a rejection reason"),
});
