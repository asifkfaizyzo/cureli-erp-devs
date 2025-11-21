import { z } from "zod";

export const uploadShopFileSchema = z.object({
  file_type: z.enum([
    "pharmacy_license",
    "drug_license",
    "gst_certificate",
    "owner_pan",
    "shop_act_license",
    "business_registration",
    "address_proof"
  ]),
});
