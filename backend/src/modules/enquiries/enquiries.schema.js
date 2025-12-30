import { z } from "zod";

export const createEnquirySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .trim(),
    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters")
      .toLowerCase()
      .trim(),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, "Phone must be 10 digits")
      .optional()
      .or(z.literal(""))
      .nullable(),  // ✅ FIX: Added nullable()
    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(2000, "Message must be less than 2000 characters")
      .trim(),
    recaptchaToken: z.string().optional().nullable(),  // ✅ FIX: Made truly optional
  }),
});

// Keep all your other schema exports below...
export const replyEnquirySchema = z.object({
  params: z.object({
    enquiryId: z.string().uuid("Invalid enquiry ID"),
  }),
  body: z.object({
    subject: z
      .string()
      .min(5, "Subject must be at least 5 characters")
      .max(200, "Subject must be less than 200 characters")
      .trim(),
    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(5000, "Message must be less than 5000 characters")
      .trim(),
  }),
});

export const updateEnquiryStatusSchema = z.object({
  params: z.object({
    enquiryId: z.string().uuid("Invalid enquiry ID"),
  }),
  body: z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED"]),
  }),
});

export const listEnquiriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED", "ALL"]).default("ALL"),
    search: z.string().optional(),
    sortBy: z.enum(["created_at", "updated_at", "status"]).default("created_at"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});
