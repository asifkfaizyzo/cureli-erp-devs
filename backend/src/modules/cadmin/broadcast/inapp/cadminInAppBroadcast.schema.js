// backend/src/modules/cadmin/broadcast/inapp/cadminInAppBroadcast.schema.js

import { z } from 'zod';
import { fail } from '../../../../utils/response.js';

// ============================================
// ATTACHMENT SCHEMA (Updated for file uploads)
// ============================================

const attachmentSchema = z.object({
  type: z.enum(['link', 'image', 'video']),
  url: z.string().min(1, 'URL is required'),
  label: z.string().max(100).optional().nullable(),
  filename: z.string().optional().nullable(), // For uploaded files
  original_name: z.string().optional().nullable(), // For uploaded files
  size: z.number().optional().nullable(), // File size in bytes
});

// ============================================
// ZOD SCHEMAS (EXPORTED)
// ============================================

// Flexible target filters - no required fields for preview
export const previewSchema = z.object({
  target_filters: z.object({
    shop_ids: z.array(z.string().uuid()).optional(),
    plan_ids: z.array(z.string().uuid()).optional(),
    registration_date_from: z.string().optional(),
    registration_date_to: z.string().optional(),
    roles: z.array(z.string()).optional(),
    includeUsers: z.boolean().optional(),
    includeCAdmins: z.boolean().optional(),
    cadmin_roles: z.array(z.string()).optional(),
  }).optional().default({}),
  include_details: z.boolean().optional().default(true),
});

export const sendNowSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title must not exceed 200 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(500, 'Message must not exceed 500 characters'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  target_filters: z.object({
    shop_ids: z.array(z.string().uuid()).optional(),
    plan_ids: z.array(z.string().uuid()).optional(),
    registration_date_from: z.string().optional(),
    registration_date_to: z.string().optional(),
    roles: z.array(z.string()).optional(),
    includeUsers: z.boolean().optional(),
    includeCAdmins: z.boolean().optional(),
    cadmin_roles: z.array(z.string()).optional(),
  }).optional().default({}),
  // Updated: limit to 1 attachment
  attachments: z.array(attachmentSchema).max(1, 'Only 1 attachment allowed').optional().default([]),
  action_url: z.string().optional().nullable().default(''),
  action_label: z.string().max(100).optional().nullable().default(''),
  expires_in_hours: z.union([
    z.coerce.number().positive(),
    z.literal(''),
    z.null(),
  ]).optional(),
  target_users: z.boolean().optional().default(true),
  target_cadmins: z.boolean().optional().default(false),
});

export const draftSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title must not exceed 200 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(500, 'Message must not exceed 500 characters'),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  target_filters: z.object({
    shop_ids: z.array(z.string().uuid()).optional(),
    plan_ids: z.array(z.string().uuid()).optional(),
    registration_date_from: z.string().optional(),
    registration_date_to: z.string().optional(),
    roles: z.array(z.string()).optional(),
    includeUsers: z.boolean().optional(),
    includeCAdmins: z.boolean().optional(),
    cadmin_roles: z.array(z.string()).optional(),
  }).optional().default({}),
  // Updated: limit to 1 attachment
  attachments: z.array(attachmentSchema).max(1, 'Only 1 attachment allowed').optional().default([]),
  action_url: z.string().optional().nullable().default(''),
  action_label: z.string().max(100).optional().nullable().default(''),
  expires_in_hours: z.union([
    z.coerce.number().positive(),
    z.literal(''),
    z.null(),
  ]).optional(),
  target_users: z.boolean().optional().default(true),
  target_cadmins: z.boolean().optional().default(false),
});

export const updateDraftSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  message: z.string().trim().min(10).max(500).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  target_filters: z.object({
    shop_ids: z.array(z.string().uuid()).optional(),
    plan_ids: z.array(z.string().uuid()).optional(),
    registration_date_from: z.string().optional(),
    registration_date_to: z.string().optional(),
    roles: z.array(z.string()).optional(),
  }).optional(),
  // Updated: limit to 1 attachment
  attachments: z.array(attachmentSchema).max(1, 'Only 1 attachment allowed').optional(),
  action_url: z.string().optional().nullable(),
  action_label: z.string().max(100).optional().nullable(),
});

export const scheduleSchema = z.object({
  scheduled_for: z.string().datetime({ message: 'scheduled_for must be a valid ISO 8601 datetime' }),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
});

export const segmentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional().nullable(),
  filters: z.record(z.any()),
});

export const templateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  title: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(500),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  // Updated: limit to 1 attachment
  attachments: z.array(attachmentSchema).max(1, 'Only 1 attachment allowed').optional().default([]),
});

// ============================================
// VALIDATION MIDDLEWARE (for backward compatibility)
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
    const result = sendNowSchema.safeParse(req.body);
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
    const result = draftSchema.safeParse(req.body);
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