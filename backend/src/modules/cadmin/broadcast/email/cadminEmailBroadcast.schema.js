// backend/src/modules/cadmin/broadcast/email/cadminEmailBroadcast.schema.js

import { z } from 'zod';

// ============================================
// REUSABLE SCHEMAS
// ============================================

const uuidSchema = z.string().uuid();

const inlineImageSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  filename: z.string().optional().nullable(),
  original_name: z.string().optional().nullable(),
  size: z.number().optional().nullable(),
}).optional().nullable();

const attachmentSchema = z.object({
  url: z.string().min(1, 'URL is required'),
  filename: z.string().optional().nullable(),
  original_name: z.string().optional().nullable(),
  size: z.number().optional().nullable(),
  mime_type: z.string().optional().nullable(),
});

const targetFiltersSchema = z.object({
  shop_ids: z.array(uuidSchema).optional().default([]),
  plan_ids: z.array(uuidSchema).optional().default([]),
  filter_mode: z.enum(['AND', 'OR']).optional().default('OR'),
  registration_date_from: z.string().optional().nullable(),
  registration_date_to: z.string().optional().nullable(),
  cadmin_roles: z.array(z.enum(['SUPER_ADMIN', 'ANALYST', 'ACCOUNTING'])).optional().default([]),
}).optional().default({});

// ============================================
// PREVIEW SCHEMA
// ============================================

export const previewSchema = z.object({
  target_filters: targetFiltersSchema,
  target_users: z.boolean().optional().default(true),
  target_cadmins: z.boolean().optional().default(false),
});

// ============================================
// DRAFT SCHEMA (Create)
// ============================================

export const createDraftSchema = z.object({
  subject: z.string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  message_text: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters'),
  target_filters: targetFiltersSchema,
  target_users: z.boolean().optional().default(true),
  target_cadmins: z.boolean().optional().default(false),
  inline_image: inlineImageSchema,
  attachments: z.array(attachmentSchema)
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
    .default([]),
  action_url: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  action_label: z.string().max(100, 'Button text too long').optional().nullable(),
}).refine(
  (data) => data.target_users || data.target_cadmins,
  { message: 'At least one of target_users or target_cadmins must be true', path: ['target_users'] }
).refine(
  (data) => {
    // If action_url is provided, action_label should also be provided
    if (data.action_url && data.action_url.length > 0 && !data.action_label) {
      return false;
    }
    return true;
  },
  { message: 'Button text is required when URL is provided', path: ['action_label'] }
);

// ============================================
// UPDATE DRAFT SCHEMA
// ============================================

export const updateDraftSchema = z.object({
  subject: z.string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .optional(),
  message_text: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .optional(),
  target_filters: targetFiltersSchema.optional(),
  target_users: z.boolean().optional(),
  target_cadmins: z.boolean().optional(),
  inline_image: inlineImageSchema,
  attachments: z.array(attachmentSchema)
    .max(5, 'Maximum 5 attachments allowed')
    .optional(),
  action_url: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  action_label: z.string().max(100, 'Button text too long').optional().nullable(),
});

// ============================================
// SEND NOW SCHEMA
// ============================================

export const sendNowSchema = z.object({
  subject: z.string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  message_text: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters'),
  target_filters: targetFiltersSchema,
  target_users: z.boolean().optional().default(true),
  target_cadmins: z.boolean().optional().default(false),
  inline_image: inlineImageSchema,
  attachments: z.array(attachmentSchema)
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
    .default([]),
  action_url: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  action_label: z.string().max(100, 'Button text too long').optional().nullable(),
}).refine(
  (data) => data.target_users || data.target_cadmins,
  { message: 'At least one of target_users or target_cadmins must be true', path: ['target_users'] }
);

// ============================================
// SCHEDULE SCHEMA
// ============================================

export const scheduleSchema = z.object({
  scheduled_for: z.string()
    .datetime({ message: 'scheduled_for must be a valid ISO 8601 datetime' }),
}).refine(
  (data) => new Date(data.scheduled_for) > new Date(),
  { message: 'Scheduled time must be in the future', path: ['scheduled_for'] }
);

// ============================================
// PAGINATION SCHEMA
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().optional().default(''),
});

// ============================================
// TEST EMAIL SCHEMA
// ============================================

export const testEmailSchema = z.object({
  subject: z.string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  message_text: z.string()
    .trim()
    .min(10, 'Message must be at least 10 characters'),
  inline_image: inlineImageSchema,
  attachments: z.array(attachmentSchema)
    .max(5, 'Maximum 5 attachments allowed')
    .optional()
    .default([]),
  action_url: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  action_label: z.string().max(100, 'Button text too long').optional().nullable(),
});

// ============================================
// UNSUBSCRIBE MANAGEMENT SCHEMAS
// ============================================

export const addToSuppressionSchema = z.object({
  email: z.string().email('Invalid email format'),
  reason: z.string().max(500).optional().nullable(),
});

export const removeFromSuppressionSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// ============================================
// FILE VALIDATION
// ============================================

export const MAX_INLINE_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB per file
export const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB total

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

export const ALLOWED_ATTACHMENT_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

export const BLOCKED_EXTENSIONS = [
  '.exe', '.sh', '.bat', '.cmd', '.msi', '.dll', '.scr',
  '.js', '.vbs', '.ps1', '.jar', '.py', '.rb',
];

/**
 * Validate file for upload
 */
export function validateFileUpload(file, isInlineImage = false) {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  // Check size
  const maxSize = isInlineImage ? MAX_INLINE_IMAGE_SIZE : MAX_ATTACHMENT_SIZE;
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / 1024 / 1024);
    errors.push(`File too large. Maximum size is ${maxMB}MB`);
  }

  // Check type
  const allowedTypes = isInlineImage ? ALLOWED_IMAGE_TYPES : ALLOWED_ATTACHMENT_TYPES;
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`File type ${file.mimetype} not allowed`);
  }

  // Check extension
  const ext = '.' + (file.originalname?.split('.').pop()?.toLowerCase() || '');
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    errors.push(`File extension ${ext} is blocked`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  previewSchema,
  createDraftSchema,
  updateDraftSchema,
  sendNowSchema,
  scheduleSchema,
  paginationSchema,
  testEmailSchema,
  addToSuppressionSchema,
  removeFromSuppressionSchema,
  validateFileUpload,
};