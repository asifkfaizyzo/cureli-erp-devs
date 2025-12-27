// backend/src/modules/tickets/tickets.schema.js

import { z } from "zod";

// ============================================
// CONSTANTS
// ============================================
const TICKET_CATEGORIES = [
  "TECHNICAL_ISSUE",
  "BILLING_ISSUE",
  "FEATURE_REQUEST",
  "ACCOUNT_ISSUE",
  "OTHER",
];

const TIME_SLOTS = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

// ============================================
// CREATE TICKET SCHEMA
// ============================================
export const createTicketSchema = z
  .object({
    // ✅ branch_id is now OPTIONAL
    branch_id: z.string().uuid("Invalid branch ID").optional().nullable(),

    contact_number: z
      .string()
      .regex(/^[0-9]{10}$/, "Contact number must be exactly 10 digits"),

    category: z.enum(TICKET_CATEGORIES, {
      errorMap: () => ({ message: "Invalid ticket category" }),
    }),

    subject: z
      .string()
      .min(5, "Subject must be at least 5 characters")
      .max(200, "Subject must be at most 200 characters")
      .transform((val) => val.trim()),

    description: z
      .string()
      .max(2000, "Description must be at most 2000 characters")
      .optional()
      .nullable()
      .transform((val) => val?.trim() || null),

    other_category_text: z
      .string()
      .max(100, "Category text must be at most 100 characters")
      .optional()
      .nullable()
      .transform((val) => val?.trim() || null),

    preferred_slot: z.enum(TIME_SLOTS, {
      errorMap: () => ({ message: "Invalid time slot" }),
    }),

    // Attachment IDs (uploaded separately, linked during creation)
    attachment_ids: z
      .array(z.string().uuid())
      .max(3, "Maximum 3 attachments allowed")
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      // If category is OTHER, other_category_text is required
      if (data.category === "OTHER" && !data.other_category_text) {
        return false;
      }
      return true;
    },
    {
      message: "Please specify the category when selecting 'Other'",
      path: ["other_category_text"],
    }
  );

// ============================================
// CANCEL TICKET SCHEMA
// ============================================
export const cancelTicketSchema = z.object({
  reason: z
    .string()
    .min(10, "Cancellation reason must be at least 10 characters")
    .max(500, "Cancellation reason must be at most 500 characters")
    .transform((val) => val.trim()),
});

// ============================================
// REOPEN TICKET SCHEMA
// ============================================
export const reopenTicketSchema = z.object({
  reason: z
    .string()
    .min(10, "Reopen reason must be at least 10 characters")
    .max(500, "Reopen reason must be at most 500 characters")
    .optional()
    .nullable()
    .transform((val) => val?.trim() || null),
});

// ============================================
// QUERY FILTERS SCHEMA (GET TICKETS)
// ============================================
export const getTicketsQuerySchema = z.object({
  status: z
    .enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED", "CLOSED"])
    .optional(),

  category: z.enum(TICKET_CATEGORIES).optional(),

  branch_id: z.string().uuid().optional(),

  search: z.string().max(100).optional(),

  date_from: z.string().optional(), // Will be converted to Date in controller

  date_to: z.string().optional(), // Will be converted to Date in controller

  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),

  limit: z
    .string()
    .optional()
    .default("20")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),

  sort_by: z
    .enum(["created_at", "updated_at", "ticket_number", "status"])
    .optional()
    .default("created_at"),

  sort_order: z.enum(["asc", "desc"]).optional().default("desc"),
});

// ============================================
// TICKET ID PARAM SCHEMA
// ============================================
export const ticketIdParamSchema = z.object({
  ticket_id: z.string().uuid("Invalid ticket ID"),
});
