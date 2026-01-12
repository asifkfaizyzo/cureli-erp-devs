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

// Price: non-negative integer (in Rupees)
const priceSchema = z
  .number()
  .int("Price must be a whole number")
  .min(0, "Price cannot be negative");

// Compare-at price: positive integer (in Rupees), optional
const compareAtPriceSchema = z
  .number()
  .int("Compare-at price must be a whole number")
  .positive("Compare-at price must be positive")
  .nullable()
  .optional();

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

// Billing cycle months: positive integer, default 12
const billingCycleMonthsSchema = z
  .number()
  .int("Billing cycle must be a whole number")
  .min(1, "Billing cycle must be at least 1 month")
  .max(36, "Billing cycle cannot exceed 36 months")
  .optional()
  .default(12);

// Bonus months: non-negative integer
const bonusMonthsSchema = z
  .number()
  .int("Bonus months must be a whole number")
  .min(0, "Bonus months cannot be negative")
  .max(12, "Bonus months cannot exceed 12")
  .optional()
  .default(0);

// Promo free until: ISO date string or null
const promoFreeUntilSchema = z
  .string()
  .datetime({ message: "Invalid date format" })
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

// Featured flag (renamed from is_highlighted)
const isFeaturedSchema = z.boolean().optional().default(false);

// Plan type
const planTypeSchema = z.enum(["PRE_MADE", "CUSTOM"]).optional().default("PRE_MADE");

// UUID for shop_id
const uuidSchema = z.string().uuid("Invalid UUID format");

// ============================================
// CREATE PLAN SCHEMA
// ============================================

export const createPlanSchema = z
  .object({
    // Core fields
    name: nameSchema,
    description: descriptionSchema,
    type: planTypeSchema,
    
    // Pricing
    price: priceSchema,
    compare_at_price: compareAtPriceSchema,
    
    // Limits
    max_users: maxUsersSchema,
    max_branches: maxBranchesSchema,
    
    // Billing duration
    billing_cycle_months: billingCycleMonthsSchema,
    bonus_months: bonusMonthsSchema,
    
    // Promotional access
    promo_free_until: promoFreeUntilSchema,
    
    // Flags
    is_featured: isFeaturedSchema,
    
    // Custom plan shop link
    created_for_shop_id: uuidSchema.optional().nullable(),
  })
  .refine(
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
  )
  .refine(
    (data) => {
      // compare_at_price must be greater than price if set
      if (data.compare_at_price !== null && data.compare_at_price !== undefined) {
        return data.compare_at_price > data.price;
      }
      return true;
    },
    {
      message: "Compare-at price must be greater than the actual price",
      path: ["compare_at_price"],
    }
  )
  .refine(
    (data) => {
      // promo_free_until must be in the future if set (for new plans)
      if (data.promo_free_until) {
        const now = new Date();
        return data.promo_free_until > now;
      }
      return true;
    },
    {
      message: "Promo free until date must be in the future",
      path: ["promo_free_until"],
    }
  );

// ============================================
// UPDATE PLAN SCHEMA
// ============================================

export const updatePlanSchema = z
  .object({
    // Core fields
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    
    // Pricing
    price: priceSchema.optional(),
    compare_at_price: compareAtPriceSchema,
    
    // Limits
    max_users: maxUsersSchema.optional(),
    max_branches: maxBranchesSchema.optional(),
    
    // Billing duration
    billing_cycle_months: billingCycleMonthsSchema.optional(),
    bonus_months: bonusMonthsSchema.optional(),
    
    // Promotional access
    promo_free_until: promoFreeUntilSchema,
    
    // Flags
    is_featured: z.boolean().optional(),
    
    // Note: type and created_for_shop_id cannot be updated after creation
  })
  .refine(
    (data) => {
      // This refinement will be checked in service layer with existing data
      // because we need to compare against existing price
      return true;
    },
    {}
  );

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
  
  // Filter by plan type
  type: z
    .enum(["PRE_MADE", "CUSTOM"])
    .optional(),
  
  // Filter by promo status
  has_active_promo: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  
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