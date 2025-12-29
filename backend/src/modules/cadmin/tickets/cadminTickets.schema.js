// backend/src/modules/cadmin/tickets/cadminTickets.schema.js

import { z } from "zod";

/**
 * ============================================
 * QUERY FILTERS SCHEMA (GET TICKETS)
 * ============================================
 */
export const getTicketsQuerySchema = z.object({
  status: z
    .enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED", "CLOSED"])
    .optional(),

  category: z
    .enum([
      "TECHNICAL_ISSUE",
      "BILLING_ISSUE",
      "FEATURE_REQUEST",
      "ACCOUNT_ISSUE",
      "OTHER",
    ])
    .optional(),

  shop_name: z.string().max(100).optional(),

  search: z.string().max(100).optional(),

  date_from: z.string().optional(),

  date_to: z.string().optional(),

  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),

  sort_by: z
    .enum(["created_at", "updated_at", "ticket_number", "status"])
    .optional()
    .default("created_at"),

  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * ============================================
 * UPDATE TICKET STATUS SCHEMA
 * ============================================
 */
export const updateTicketStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "RESOLVED",
    "CANCELLED",
    "CLOSED",
  ]),

  admin_notes: z
    .string()
    .max(1000, "Admin notes must be at most 1000 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

/**
 * ============================================
 * ADD ADMIN NOTE SCHEMA
 * ============================================
 */
export const addAdminNoteSchema = z.object({
  note: z
    .string()
    .min(5, "Note must be at least 5 characters")
    .max(500, "Note must be at most 500 characters")
    .transform((val) => val.trim()),
});
