// backend/src/modules/sales/sales.schema.js

import { z } from "zod";

// ============================================
// LINE ITEM SCHEMA
// ============================================

const salesLineItemSchema = z.object({
  medicine_id: z.string().uuid(),
  inventory_id: z.string().uuid(),
  batch_number: z.string().max(50),
  expiry_date: z.string().datetime(),
  quantity: z.number().positive(),
  unit_of_measure: z.enum(["UNIT", "STRIP", "BOX", "BOTTLE"]).default("UNIT"),
  mrp: z.number().positive(),
  purchase_rate: z.number().positive().optional().nullable(),
  discount_percent: z.number().min(0).max(100).default(0),
  cgst_percent: z.number().min(0).max(100).default(0),
  sgst_percent: z.number().min(0).max(100).default(0),
});

// ============================================
// CREATE SALES INVOICE
// ============================================

export const createSalesInvoiceSchema = z.object({
  // Customer (optional)
  customer_id: z.string().uuid().optional().nullable(),
  walkin_name: z.string().max(200).optional().nullable(),
  walkin_phone: z.string().max(20).optional().nullable(),

  // Date
  invoice_date: z.string().datetime(),
  due_date: z.string().datetime().optional().nullable(),

  // Discounts
  bill_discount_percent: z.number().min(0).max(100).default(0),

  // Prescription
  prescription_number: z.string().max(50).optional().nullable(),
  doctor_name: z.string().max(200).optional().nullable(),

  // Items
  lineItems: z.array(salesLineItemSchema).min(1),

  // Payments (optional - can add items first, pay later)
  payments: z.array(z.object({
    amount: z.number().positive(),
    payment_mode: z.enum(["CASH", "CARD", "UPI", "CREDIT"]),
    reference_number: z.string().max(100).optional().nullable(),
  })).optional(),

  // Remarks
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// UPDATE SALES INVOICE (DRAFT/PARKED only)
// ============================================

export const updateSalesInvoiceSchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  walkin_name: z.string().max(200).optional().nullable(),
  walkin_phone: z.string().max(20).optional().nullable(),
  invoice_date: z.string().datetime().optional(),
  due_date: z.string().datetime().optional().nullable(),
  bill_discount_percent: z.number().min(0).max(100).optional(),
  prescription_number: z.string().max(50).optional().nullable(),
  doctor_name: z.string().max(200).optional().nullable(),
  lineItems: z.array(salesLineItemSchema).optional(),
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// ADD ITEMS TO INVOICE
// ============================================

export const addItemsSchema = z.object({
  lineItems: z.array(salesLineItemSchema).min(1),
});

// ============================================
// REMOVE ITEM FROM INVOICE
// ============================================

export const removeItemSchema = z.object({
  item_id: z.string().uuid(),
});

// ============================================
// CONFIRM INVOICE
// ============================================

export const confirmInvoiceSchema = z.object({
  payments: z.array(z.object({
    amount: z.number().positive(),
    payment_mode: z.enum(["CASH", "CARD", "UPI", "CREDIT"]),
    reference_number: z.string().max(100).optional().nullable(),
  })).optional(),
});

// ============================================
// RECORD PAYMENT
// ============================================

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  payment_mode: z.enum(["CASH", "CARD", "UPI", "CREDIT"]),
  payment_date: z.string().datetime().optional(),
  reference_number: z.string().max(100).optional().nullable(),
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// CANCEL INVOICE
// ============================================

export const cancelInvoiceSchema = z.object({
  reason: z.string().min(5).max(500),
});

// ============================================
// PARK INVOICE (save for later)
// ============================================

export const parkInvoiceSchema = z.object({
  remarks: z.string().max(500).optional().nullable(),
});

// ============================================
// SALES RETURN SCHEMAS
// ============================================

export const createSalesReturnSchema = z.object({
  parent_invoice_id: z.string().uuid(),
  
  return_reason: z.enum([
    "EXPIRED_PRODUCT",
    "DAMAGED_PRODUCT",
    "WRONG_PRODUCT",
    "CUSTOMER_REQUEST",
    "QUALITY_ISSUE",
    "PRICE_DISPUTE",
    "OTHER",
  ]),
  return_notes: z.string().max(500).optional().nullable(),

  // Items being returned
  lineItems: z.array(z.object({
    item_id: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),

  // Refund method
  refund_mode: z.enum(["CASH", "CREDIT", "ADJUST_NEXT"]).default("CASH"),

  remarks: z.string().max(500).optional().nullable(),
});

export const cancelSalesReturnSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
});

// ============================================
// CHECK STOCK AVAILABILITY
// ============================================

export const checkStockSchema = z.object({
  items: z.array(z.object({
    inventory_id: z.string().uuid(),
    quantity: z.number().positive(),
  })).min(1),
});

// ============================================
// GET AVAILABLE BATCHES
// ============================================

export const getBatchesSchema = z.object({
  medicine_id: z.string().uuid(),
  include_low_stock: z.boolean().default(false),
  include_expiring: z.boolean().default(true),
});