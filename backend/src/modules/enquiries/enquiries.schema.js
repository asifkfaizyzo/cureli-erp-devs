import { z } from "zod";

// Public: Body schema for enquiry submission
export const createEnquirySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  phone: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),
  message: z.string().min(10).max(2000).trim(),
  recaptchaToken: z.string().optional(),
});

// Admin: Body schema for reply
export const replyEnquirySchema = z.object({
  subject: z.string().min(5).max(200).trim(),
  message: z.string().min(10).max(5000).trim(),
});

// Admin: Body schema for status update
export const updateEnquiryStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED"]),
});

// Admin: Query schema for listing
export const listEnquiriesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED", "ALL"]).default("ALL"),
  search: z.string().optional(),
  sortBy: z.enum(["created_at", "updated_at", "status"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Admin: Param schema for enquiry ID
export const enquiryIdParamSchema = z.object({
  enquiryId: z.string().uuid("Invalid enquiry ID"),
});