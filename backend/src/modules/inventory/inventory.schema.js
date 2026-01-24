import { z } from "zod";

export const createAdjustmentSchema = z.object({
  branchId: z.string().uuid().optional().nullable(),
  medicineId: z.string().uuid(),
  inventoryId: z.string().uuid(),
  batchNumber: z.string().max(50),
  newQuantity: z.number().min(0),
  reason: z.enum([
    "PHYSICAL_COUNT_VARIANCE",
    "DAMAGED_GOODS",
    "EXPIRED_GOODS",
    "SYSTEM_CORRECTION",
    "THEFT_LOSS",
    "OTHER"
  ]),
  reasonNotes: z.string().max(500).optional().nullable(),
  adjustmentDate: z.string().datetime().optional(),
});