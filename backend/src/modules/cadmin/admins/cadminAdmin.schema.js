import { z } from "zod";
import { fail } from "../../../utils/response.js";

// ============================================
// ENUMS & CONSTANTS
// ============================================

const ALLOWED_LIMITS = [6, 8, 10, 12, 14, 20];
const ALLOWED_SORT_FIELDS = ["name", "username", "role", "created_at", "last_login_at"];
const ALLOWED_SORT_ORDER = ["asc", "desc"];
const ALLOWED_STATUS = ["", "active", "inactive"];
const ALLOWED_ROLES = ["", "super_admin", "analyst", "accounting"];
const CADMIN_ROLES = ["SUPER_ADMIN", "ANALYST", "ACCOUNTING"];

// ============================================
// ZOD SCHEMAS
// ============================================

const getAdminsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().refine((v) => ALLOWED_LIMITS.includes(v), {
    message: `Limit must be one of: ${ALLOWED_LIMITS.join(", ")}`,
  }).default(10),
  search: z.string().trim().default(""),
  status: z.string().trim().toLowerCase().refine((v) => ALLOWED_STATUS.includes(v), {
    message: "Invalid status filter",
  }).default(""),
  role: z.string().trim().toLowerCase().refine((v) => ALLOWED_ROLES.includes(v), {
    message: "Invalid role filter",
  }).default(""),
  sort: z.string().trim().toLowerCase().refine((v) => !v || ALLOWED_SORT_FIELDS.includes(v), {
    message: `Sort must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`,
  }).default("created_at"),
  order: z.string().trim().toLowerCase().refine((v) => ALLOWED_SORT_ORDER.includes(v), {
    message: "Order must be 'asc' or 'desc'",
  }).default("desc"),
});

const createAdminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters").max(50, "Password must be less than 50 characters"),
  role: z.enum(CADMIN_ROLES).default("SUPER_ADMIN"),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

const updateAdminSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
  phone: z.string().trim().regex(/^\d{10}$/).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(CADMIN_ROLES).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

const toggleAccessSchema = z.object({
  is_active: z.boolean({ required_error: "is_active (boolean) is required" }),
});

const getActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().trim().default(""),
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export function validateGetAdminsQuery(req, res, next) {
  try {
    const result = getAdminsQuerySchema.safeParse(req.query);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return fail(res, firstError.message, 400);
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, "Invalid query parameters", 400);
  }
}

export function validateCreateAdmin(req, res, next) {
  try {
    const result = createAdminSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return fail(res, "Validation failed", 400, { errors });
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, "Invalid request body", 400);
  }
}

export function validateUpdateAdmin(req, res, next) {
  try {
    const result = updateAdminSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      return fail(res, "Validation failed", 400, { errors });
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, "Invalid request body", 400);
  }
}

export function validateToggleAccess(req, res, next) {
  try {
    const result = toggleAccessSchema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return fail(res, firstError.message, 400);
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, "Invalid request body", 400);
  }
}

export function validateGetActivityQuery(req, res, next) {
  try {
    const result = getActivityQuerySchema.safeParse(req.query);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return fail(res, firstError.message, 400);
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, "Invalid query parameters", 400);
  }
}