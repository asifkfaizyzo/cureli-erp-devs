// backend/src/modules/marketplace-listings/listings.schema.js

import { z } from "zod";

export const getListingsSchema = z.object({
  branch_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).default(""),
  category: z.string().max(150).default(""),
  visibility: z.enum(["all", "visible", "hidden"]).default("all"),
  stock: z.enum(["all", "in_stock", "out_of_stock"]).default("all"),
  sort: z
    .enum(["name_asc", "name_desc", "price_asc", "price_desc", "stock_asc"])
    .default("name_asc"),
  tab: z.enum(["linked", "unlinked"]).default("linked"),
});

export const updateListingSchema = z
  .object({
    is_visible: z.boolean().optional(),
    stock_status: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional(),
    marketplace_price: z.number().min(0).optional(),
    requires_prescription: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length >= 1, {
    message: "At least one field is required",
  });

export const bulkUpdateSchema = z.object({
  listing_ids: z.array(z.string().uuid()).min(1).max(500),
  patch: z
    .object({
      is_visible: z.boolean().optional(),
      stock_status: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).optional(),
      marketplace_price: z.number().min(0).optional(),
      requires_prescription: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length >= 1, {
      message: "At least one field in patch is required",
    }),
});

export const categoryVisibilitySchema = z.object({
  branch_id: z.string().uuid().optional(),
  category_name: z.string().max(150).min(1),
  is_enabled: z.boolean(),
});

export const branchIdQuerySchema = z.object({
  branch_id: z.string().uuid().optional(),
});

export const listingIdParamSchema = z.object({
  listing_id: z.string().uuid(),
});