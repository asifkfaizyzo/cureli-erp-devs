// ============================================
// CADMIN IN-APP BROADCAST VALIDATION SCHEMAS
// ============================================

import { z } from 'zod';
import { fail } from '../../../../utils/response.js';

// ============================================
// ZOD SCHEMAS
// ============================================

const targetFiltersSchema = z.object({
  shop_ids: z.array(z.string().uuid()).optional(),
  plan_ids: z.array(z.string().uuid()).optional(),
  registration_date_from: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  registration_date_to: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  roles: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // At least one filter must be provided
    return data.shop_ids || data.plan_ids || data.registration_date_from || data.registration_date_to || data.roles;
  },
  {
    message: 'At least one filter (shop_ids, plan_ids, or date range) must be provided',
  }
);

const previewSchema = z.object({
  target_filters: targetFiltersSchema,
});

const sendImmediateSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title must not exceed 200 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(500, 'Message must not exceed 500 characters'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  target_filters: targetFiltersSchema,
});

const createDraftSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title must not exceed 200 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(500, 'Message must not exceed 500 characters'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  target_filters: targetFiltersSchema,
});

const updateDraftSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  message: z.string().trim().min(10).max(500).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  target_filters: targetFiltersSchema.optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

const scheduleSchema = z.object({
  scheduled_for: z.string().datetime({ message: 'scheduled_for must be a valid ISO 8601 datetime' }),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export function validatePreview(req, res, next) {
  try {
    const result = previewSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return fail(res, 'Validation failed', 400, { errors });
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, 'Invalid request body', 400);
  }
}

export function validateSendImmediate(req, res, next) {
  try {
    const result = sendImmediateSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return fail(res, 'Validation failed', 400, { errors });
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, 'Invalid request body', 400);
  }
}

export function validateCreateDraft(req, res, next) {
  try {
    const result = createDraftSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return fail(res, 'Validation failed', 400, { errors });
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, 'Invalid request body', 400);
  }
}

export function validateUpdateDraft(req, res, next) {
  try {
    const result = updateDraftSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return fail(res, 'Validation failed', 400, { errors });
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, 'Invalid request body', 400);
  }
}

export function validateSchedule(req, res, next) {
  try {
    const result = scheduleSchema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return fail(res, 'Validation failed', 400, { errors });
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, 'Invalid request body', 400);
  }
}

export function validatePagination(req, res, next) {
  try {
    const result = paginationSchema.safeParse(req.query);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return fail(res, firstError.message, 400);
    }
    req.validated = result.data;
    return next();
  } catch (err) {
    return fail(res, 'Invalid query parameters', 400);
  }
}