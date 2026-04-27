// backend/src/modules/cadmin/admins/cadminAdmin.schema.js

import { z } from "zod";
import { fail } from "../../../utils/response.js";

// ============================================
// CONSTANTS
// ============================================

const ALLOWED_SORT_FIELDS = ["name", "username", "created_at", "last_login_at"];
const ALLOWED_SORT_ORDER  = ["asc", "desc"];
const ALLOWED_STATUS      = ["", "active", "inactive"];

// ============================================
// ZOD SCHEMAS
// ============================================

const getAdminsQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().default(""),

  status: z
    .string().trim().toLowerCase()
    .refine((v) => ALLOWED_STATUS.includes(v), { message: "Invalid status filter" })
    .default(""),

  // Role is now a free-text search (custom role name) not an enum
  // Empty string means no filter
  role: z.string().trim().default(""),

  sort: z
    .string().trim().toLowerCase()
    .refine((v) => !v || ALLOWED_SORT_FIELDS.includes(v), {
      message: `Sort must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}`,
    })
    .default("created_at"),

  order: z
    .string().trim().toLowerCase()
    .refine((v) => ALLOWED_SORT_ORDER.includes(v), { message: "Order must be 'asc' or 'desc'" })
    .default("desc"),
});

const uuidSchema = z.string().uuid("Invalid UUID format");

const createAdminSchema = z.object({
  name:     z.string().trim().min(2).max(100),
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  phone:    z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  email:    z.string().trim().email(),
  password: z.string().min(8).max(50),
  status:   z.enum(["Active", "Inactive"]).default("Active"),

  // Optional role assignment at creation time
  role_ids:        z.array(uuidSchema).optional(),
  primary_role_id: uuidSchema.optional(),
}).refine(
  (data) => {
    // If role_ids provided, primary_role_id must also be provided
    if (data.role_ids && data.role_ids.length > 0) {
      return !!data.primary_role_id;
    }
    return true;
  },
  {
    message:  "primary_role_id is required when role_ids are provided",
    path:     ["primary_role_id"],
  }
).refine(
  (data) => {
    // primary_role_id must be in role_ids
    if (data.role_ids && data.primary_role_id) {
      return data.role_ids.includes(data.primary_role_id);
    }
    return true;
  },
  {
    message: "primary_role_id must be one of the role_ids provided",
    path:    ["primary_role_id"],
  }
);

const updateAdminSchema = z
  .object({
    name:     z.string().trim().min(2).max(100).optional(),
    username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/).optional(),
    phone:    z.string().trim().regex(/^\d{10}$/).optional(),
    email:    z.string().trim().email().optional(),
    // role is intentionally removed — use PUT /admins/:id/roles instead
  })
  .refine((data) => Object.keys(data).filter(k => data[k] !== undefined).length > 0, {
    message: "At least one field must be provided for update",
  });

const toggleAccessSchema = z.object({
  is_active: z.boolean({ required_error: "is_active (boolean) is required" }),
});

const getActivityQuerySchema = z.object({
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
  action: z.string().trim().default(""),
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export function validateGetAdminsQuery(req, res, next) {
  const result = getAdminsQuerySchema.safeParse(req.query);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateCreateAdmin(req, res, next) {
  const result = createAdminSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join("."),
      message: e.message,
    }));
    return fail(res, "Validation failed", 400, { errors });
  }
  req.validated = result.data;
  return next();
}

export function validateUpdateAdmin(req, res, next) {
  const result = updateAdminSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join("."),
      message: e.message,
    }));
    return fail(res, "Validation failed", 400, { errors });
  }
  req.validated = result.data;
  return next();
}

export function validateToggleAccess(req, res, next) {
  const result = toggleAccessSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

export function validateGetActivityQuery(req, res, next) {
  const result = getActivityQuerySchema.safeParse(req.query);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}

// For creating a super admin — extends createAdminSchema
const createSuperAdminSchema = z.object({
  name:     z.string().trim().min(2).max(100),
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  phone:    z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  email:    z.string().trim().email(),
  password: z.string().min(8).max(50),
  status:   z.enum(["Active", "Inactive"]).default("Active"),
  // No role_ids — super admins don't use roles
});

// For deactivating a super admin — requires secret
const toggleSuperAdminAccessSchema = z.object({
  is_active: z.boolean({ required_error: "is_active (boolean) is required" }),
  secret:    z.string().min(1, "Secret is required"),
});

export function validateCreateSuperAdmin(req, res, next) {
  const result = createSuperAdminSchema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field:   e.path.join("."),
      message: e.message,
    }));
    return fail(res, "Validation failed", 400, { errors });
  }
  req.validated = result.data;
  return next();
}

export function validateToggleSuperAdminAccess(req, res, next) {
  const result = toggleSuperAdminAccessSchema.safeParse(req.body);
  if (!result.success) {
    return fail(res, result.error.errors[0].message, 400);
  }
  req.validated = result.data;
  return next();
}