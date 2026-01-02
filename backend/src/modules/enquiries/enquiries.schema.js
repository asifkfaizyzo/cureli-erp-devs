// enquiries.schema.js
import { z } from "zod";

// ✅ Reusable UUID param schema
const uuidParamSchema = z.object({
  params: z.object({
    enquiryId: z.string().uuid("Invalid enquiry ID"),
  }),
});

// ✅ Public enquiry submission schema
export const createEnquirySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).trim(),
    email: z.string().email().max(255).toLowerCase().trim(),
    phone: z.string().regex(/^[0-9]{10}$/).optional().or(z.literal("")),
    message: z.string().min(10).max(2000).trim(),
    recaptchaToken: z.string().optional(),
  }),
});

// ✅ Admin reply schema
export const replyEnquirySchema = z.object({
  params: z.object({
    enquiryId: z.string().uuid(),
  }),
  body: z.object({
    subject: z.string().min(5).max(200).trim(),
    message: z.string().min(10).max(5000).trim(),
  }),
});

// ✅ Update status schema
export const updateEnquiryStatusSchema = z.object({
  params: z.object({
    enquiryId: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED"]),
  }),
});

// ✅ List enquiries schema
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

// ✅ Simple param-only schemas (reuse pattern)
export const deleteEnquirySchema = uuidParamSchema;
export const getEnquiryDetailsSchema = uuidParamSchema;

// // enquiries.schema.js

// import { z } from "zod";

// export const createEnquirySchema = z.object({
//   body: z.object({
//     name: z
//       .string()
//       .min(2, "Name must be at least 2 characters")
//       .max(100, "Name must be less than 100 characters")
//       .trim(),
//     email: z
//       .string()
//       .email("Invalid email address")
//       .max(255, "Email must be less than 255 characters")
//       .toLowerCase()
//       .trim(),
//     // ✅ FIXED: Use union type for phone
//     phone: z.union([
//       z.string().regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
//       z.string().length(0),  // Allow empty string
//       z.null(),
//       z.undefined(),
//     ]).optional(),
//     message: z
//       .string()
//       .min(10, "Message must be at least 10 characters")
//       .max(2000, "Message must be less than 2000 characters")
//       .trim(),
//     recaptchaToken: z.string().optional().nullable(),
//   }),
// });

// export const replyEnquirySchema = z.object({
//   params: z.object({
//     enquiryId: z.string().uuid("Invalid enquiry ID"),
//   }),
//   body: z.object({
//     subject: z
//       .string()
//       .min(5, "Subject must be at least 5 characters")
//       .max(200, "Subject must be less than 200 characters")
//       .trim(),
//     message: z
//       .string()
//       .min(10, "Message must be at least 10 characters")
//       .max(5000, "Message must be less than 5000 characters")
//       .trim(),
//   }),
// });

// export const updateEnquiryStatusSchema = z.object({
//   params: z.object({
//     enquiryId: z.string().uuid("Invalid enquiry ID"),
//   }),
//   body: z.object({
//     status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED"]),
//   }),
// });

// export const listEnquiriesSchema = z.object({
//   query: z.object({
//     page: z.coerce.number().min(1).default(1),
//     limit: z.coerce.number().min(1).max(100).default(10),
//     status: z.enum(["PENDING", "IN_PROGRESS", "REPLIED", "CLOSED", "ALL"]).default("ALL"),
//     search: z.string().optional(),
//     sortBy: z.enum(["created_at", "updated_at", "status"]).default("created_at"),
//     sortOrder: z.enum(["asc", "desc"]).default("desc"),
//   }),
// });