import { z } from "zod";

export const shopSetupSchema = z.object({
  business_name: z.string().min(1),
  legal_name: z.string().optional(),
  gst_number: z.string().optional(),
  business_type: z.string().min(1),

  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().min(1),
});
