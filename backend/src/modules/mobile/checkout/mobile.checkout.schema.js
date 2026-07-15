// backend/src/modules/mobile/checkout/mobile.checkout.schema.js

import { z } from 'zod';

export const quoteSchema = z.object({
  branch_id:   z.string().uuid(),
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity:  z.number().int().min(1).max(100),
  })).min(1).max(20),
  distance_km: z.number().min(0).max(500),
  tip:         z.number().min(0).max(1000).optional().default(0),
});

export const createSessionSchema = z.object({
  branch_id:           z.string().uuid(),
  delivery_address_id: z.string().uuid(),
  items: z.array(z.object({
    variantId: z.string().uuid(),
    quantity:  z.number().int().min(1).max(100),
  })).min(1).max(20),
  distance_km:         z.number().min(0).max(500),
  tip:                 z.number().min(0).max(1000).optional().default(0),
  prescription_files: z.array(z.object({
    prescription_key: z.string(),
    original_name:    z.string(),
    mime_type:        z.enum(['image/jpeg','image/jpg','image/png','application/pdf']),
    file_size:        z.number().int().min(1),
  })).max(5).optional().default([]),
});

export const confirmSchema = z.object({
  session_id:          z.string().uuid(),
  razorpay_payment_id: z.string().min(1),
  razorpay_order_id:   z.string().min(1),
  razorpay_signature:  z.string().min(1),
});