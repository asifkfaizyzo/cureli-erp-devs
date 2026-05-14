// src/modules/mobile/users/mobile.users.schema.js

import { z } from "zod";

// ── Profile Update ────────────────────────────────────────────
// All fields optional — PATCH semantics.
// At least one field required (validated at service layer).

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(200, { message: "Name must not exceed 200 characters" })
    .optional(),

  email: z
    .string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255)
    .optional()
    .nullable(),

  profile_image_key: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable(),
});

// ── Address ───────────────────────────────────────────────────

const addressLabel = z.enum(["Home", "Work", "Other"], {
  errorMap: () => ({ message: "Label must be Home, Work, or Other" }),
});

const indianPincode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "Pincode must be exactly 6 digits" });

const recipientPhone = z
  .string()
  .trim()
  .transform((val) => val.replace(/\s+/g, ""))
  .refine(
    (val) => {
      const stripped = val.replace(/^\+?91/, "");
      return /^[6-9]\d{9}$/.test(stripped);
    },
    { message: "Invalid Indian mobile number" }
  )
  .transform((val) => {
    const stripped = val.replace(/^\+?91/, "");
    return `+91${stripped}`;
  })
  .optional()
  .nullable();

export const createAddressSchema = z
  .object({
    label: addressLabel,
    custom_label: z.string().trim().max(100).optional().nullable(),
    recipient_name: z.string().trim().max(200).optional().nullable(),
    recipient_phone: recipientPhone,
    address_line_1: z
      .string()
      .trim()
      .min(5, { message: "Address is too short" })
      .max(300),
    address_line_2: z.string().trim().max(300).optional().nullable(),
    landmark: z.string().trim().max(200).optional().nullable(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    pincode: indianPincode,
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    is_default: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      // custom_label is required when label is "Other"
      if (data.label === "Other" && !data.custom_label?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: "Custom label is required when label is Other",
      path: ["custom_label"],
    }
  );

// Update address — all fields optional
export const updateAddressSchema = z
  .object({
    label: addressLabel.optional(),
    custom_label: z.string().trim().max(100).optional().nullable(),
    recipient_name: z.string().trim().max(200).optional().nullable(),
    recipient_phone: recipientPhone,
    address_line_1: z.string().trim().min(5).max(300).optional(),
    address_line_2: z.string().trim().max(300).optional().nullable(),
    landmark: z.string().trim().max(200).optional().nullable(),
    city: z.string().trim().min(1).max(100).optional(),
    state: z.string().trim().min(1).max(100).optional(),
    pincode: indianPincode.optional(),
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    is_default: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.label === "Other" && data.custom_label !== undefined) {
        if (!data.custom_label?.trim()) return false;
      }
      return true;
    },
    {
      message: "Custom label is required when label is Other",
      path: ["custom_label"],
    }
  );