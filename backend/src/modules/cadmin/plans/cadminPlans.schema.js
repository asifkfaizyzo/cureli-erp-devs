import { z } from "zod";

// ============================================
// SHARED FIELD SCHEMAS
// ============================================

// Plan name: 3-100 characters, trimmed
const nameSchema = z
  .string()
  .min(3, "Plan name must be at least 3 characters")
  .max(100, "Plan name cannot exceed 100 characters")
  .transform((val) => val.trim());

// Description: 10-500 characters
const descriptionSchema = z
  .string()
  .min(10, "Description must be at least 10 characters")
  .max(500, "Description cannot exceed 500 characters")
  .transform((val) => val.trim());

// Price: non-negative integer (in paisa)
const priceSchema = z
  .number()
  .int("Price must be a whole number")
  .min(0, "Price cannot be negative");

// User limit: -1 for unlimited, otherwise >= 1
const maxUsersSchema = z
  .number()
  .int("User limit must be a whole number")
  .refine(
    (val) => val === -1 || val >= 1,
    "User limit must be at least 1 (or -1 for unlimited)"
  );

// Branch limit: -1 for unlimited, otherwise >= 1
const maxBranchesSchema = z
  .number()
  .int("Branch limit must be a whole number")
  .refine(
    (val) => val === -1 || val >= 1,
    "Branch limit must be at least 1 (or -1 for unlimited)"
  );

// Highlighted flag
const isHighlightedSchema = z.boolean().optional().default(false);

// Plan type
const planTypeSchema = z.enum(["PRE_MADE", "CUSTOM"]).optional().default("PRE_MADE");

// UUID for shop_id
const uuidSchema = z.string().uuid("Invalid UUID format");

// ============================================
// CREATE PLAN SCHEMA
// ============================================

export const createPlanSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  max_users: maxUsersSchema,
  max_branches: maxBranchesSchema,
  is_highlighted: isHighlightedSchema,
  type: planTypeSchema,
  // Only required when type is CUSTOM
  created_for_shop_id: uuidSchema.optional().nullable(),
}).refine(
  (data) => {
    // If type is CUSTOM, shop_id is required
    if (data.type === "CUSTOM" && !data.created_for_shop_id) {
      return false;
    }
    return true;
  },
  {
    message: "Shop ID is required for custom plans",
    path: ["created_for_shop_id"],
  }
);

// ============================================
// UPDATE PLAN SCHEMA
// ============================================

export const updatePlanSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  price: priceSchema.optional(),
  max_users: maxUsersSchema.optional(),
  max_branches: maxBranchesSchema.optional(),
  is_highlighted: z.boolean().optional(),
  // Note: type and created_for_shop_id cannot be updated after creation
});

// ============================================
// CLONE PLAN SCHEMA
// ============================================

export const clonePlanSchema = z.object({
  name: nameSchema.optional(),
});

// ============================================
// LIST PLANS QUERY SCHEMA
// ============================================

export const listPlansQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, "Page must be at least 1"),
  
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
  
  search: z.string().optional(),
  
  status: z
    .enum(["DRAFT", "ACTIVE", "DEPRECATED", "SUSPENDED"])
    .optional(),
  
  // NEW: Filter by plan type
  type: z
    .enum(["PRE_MADE", "CUSTOM"])
    .optional(),
  
  sort_by: z
    .enum(["created_at", "name", "price", "status", "activated_at"])
    .optional()
    .default("created_at"),
  
  sort_order: z
    .enum(["asc", "desc"])
    .optional()
    .default("desc"),
  
  include_deleted: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});