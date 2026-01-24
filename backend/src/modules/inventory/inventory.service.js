// backend/src/modules/inventory/inventory.service.js
import prisma from "../../config/prisma.js";

/* =====================================================
   Custom Error (same pattern used implicitly in Purchase)
===================================================== */
class ApiError extends Error {
  constructor(message, statusCode = 400, code = "INVENTORY_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/* =====================================================
   INVENTORY SERVICE
===================================================== */
class InventoryService {
  /* ============================================
     GET OR CREATE INVENTORY (USED BY PURCHASE)
  ============================================ */
  async getOrCreateInventory(shopId, branchId, medicineId, batchNumber, expiryDate, mrp) {
    let inventory = await prisma.inventory.findFirst({
      where: {
        shop_id: shopId,
        branch_id: branchId,
        medicine_id: medicineId,
        batch_number: batchNumber,
      },
    });

    if (!inventory) {
      inventory = await prisma.inventory.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicineId,
          batch_number: batchNumber,
          expiry_date: new Date(expiryDate),
          mrp,
          current_stock: 0,
          available_stock: 0,
        },
      });
    }

    return inventory;
  }

  /* ============================================
     UPDATE STOCK + LEDGER ENTRY
  ============================================ */
  async updateStock(data, userId) {
    const {
      inventoryId,
      shopId,
      branchId,
      medicineId,
      batchNumber,
      movementType,
      quantityIn = 0,
      quantityOut = 0,
      rate,
      referenceType,
      referenceId,
      referenceNumber,
      transactionDate,
      remarks,
    } = data;

    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId },
      });

      if (!inventory) {
        throw new ApiError("Inventory not found", 404, "NOT_FOUND");
      }

      const qtyIn = Number(quantityIn);
      const qtyOut = Number(quantityOut);
      const netQty = qtyIn - qtyOut;

      const newStock = Number(inventory.current_stock) + netQty;

      if (newStock < 0) {
        throw new ApiError(
          `Insufficient stock. Available: ${inventory.current_stock}, Requested: ${qtyOut}`,
          400,
          "INSUFFICIENT_STOCK"
        );
      }

      const updatedInventory = await tx.inventory.update({
        where: { inventory_id: inventoryId },
        data: {
          current_stock: newStock,
          available_stock: newStock - Number(inventory.reserved_stock || 0),
        },
      });

      const ledgerEntry = await tx.stockLedger.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicineId,
          inventory_id: inventoryId,
          movement_type: movementType,
          reference_type: referenceType,
          reference_id: referenceId,
          reference_number: referenceNumber,
          batch_number: batchNumber,
          expiry_date: inventory.expiry_date,
          quantity_in: qtyIn,
          quantity_out: qtyOut,
          quantity_net: netQty,
          balance_after: newStock,
          rate: rate || null,
          amount: rate ? Number(netQty) * Number(rate) : null,
          transaction_date: transactionDate ? new Date(transactionDate) : new Date(),
          created_by: userId,
          remarks,
        },
      });

      return { inventory: updatedInventory, ledgerEntry };
    });
  }

 /* ============================================
   GET INVENTORY LIST
============================================ */
async getInventory(shopId, filters = {}) {
  const {
    branchId,
    medicineId,
    search,
    includeExpired = false,
    lowStock = false,
    limit = 100,
    offset = 0,
  } = filters;

  const where = {
    shop_id: shopId,
    ...(branchId && { branch_id: branchId }),
    ...(medicineId && { medicine_id: medicineId }),
    is_active: true,
    ...(!includeExpired && { is_expired: false }),
    ...(search && {
      medicine: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { manufacturer: { contains: search, mode: "insensitive" } },
        ],
      },
    }),
  };

  const rawInventories = await prisma.inventory.findMany({
    where,
    include: {
      medicine: {
        select: {
          name: true,
          manufacturer: true,
          pack_size: true,
          hsn_code: true,
          category: true,
        },
      },
      branch: {
        select: {
          branch_name: true,
        },
      },
      stockMovements: {
        where: {
          movement_type: "PURCHASE",
          reference_type: "PURCHASE_INVOICE",
        },
        take: 1,
        orderBy: {
          transaction_date: 'desc',
        },
        include: {
          purchaseInvoice: {
            select: {
              supplier: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ expiry_date: "asc" }, { batch_number: "asc" }],
    take: limit,
    skip: offset,
  });

  // ✅ FIXED: Properly map and add supplier_name
  let inventories = rawInventories.map((inv) => {
    const supplierName = inv.stockMovements?.[0]?.purchaseInvoice?.supplier?.name || null;
    
    // Remove stockMovements from response to keep it clean (optional)
    const { stockMovements, ...rest } = inv;
    
    return {
      ...rest,
      supplier_name: supplierName,
    };
  });

  if (lowStock) {
    inventories = inventories.filter(
      (inv) =>
        inv.minimum_stock !== null &&
        Number(inv.current_stock) <= Number(inv.minimum_stock)
    );
  }

  const total = await prisma.inventory.count({ where });

  return { inventories, total };
}
  /* ============================================
     INVENTORY BY MEDICINE
  ============================================ */
  async getInventoryByMedicine(shopId, medicineId, filters = {}) {
    const { branchId, includeExpired = false } = filters;

    return prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        medicine_id: medicineId,
        ...(branchId && { branch_id: branchId }),
        is_active: true,
        ...(!includeExpired && { is_expired: false }),
      },
      include: {
        medicine: {
          select: {
            name: true,
            manufacturer: true,
            pack_size: true,
          },
        },
        branch: {
          select: {
            branch_name: true,
          },
        },
      },
      orderBy: [{ expiry_date: "asc" }, { batch_number: "asc" }],
    });
  }

  /* ============================================
     LOW STOCK ITEMS
  ============================================ */
  async getLowStockItems(shopId, branchId = null) {
    const inventories = await prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        ...(branchId && { branch_id: branchId }),
        is_active: true,
        is_expired: false,
        minimum_stock: { not: null },
      },
      include: {
        medicine: {
          select: { name: true, manufacturer: true },
        },
        branch: {
          select: { branch_name: true },
        },
      },
    });

    return inventories.filter(
      (inv) => Number(inv.current_stock) <= Number(inv.minimum_stock || 0)
    );
  }

  /* ============================================
     EXPIRING SOON
  ============================================ */
  async getExpiringSoonItems(shopId, daysAhead = 90, branchId = null) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        ...(branchId && { branch_id: branchId }),
        is_active: true,
        is_expired: false,
        expiry_date: {
          gte: new Date(),
          lte: futureDate,
        },
        current_stock: { gt: 0 },
      },
      include: {
        medicine: {
          select: { name: true, manufacturer: true },
        },
        branch: {
          select: { branch_name: true },
        },
      },
      orderBy: { expiry_date: "asc" },
    });
  }

  /* ============================================
     STOCK LEDGER
  ============================================ */
  async getStockLedger(shopId, filters = {}) {
    const {
      medicineId,
      batchNumber,
      movementType,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    const where = {
      shop_id: shopId,
      ...(medicineId && { medicine_id: medicineId }),
      ...(batchNumber && { batch_number: batchNumber }),
      ...(movementType && { movement_type: movementType }),
      ...(startDate &&
        endDate && {
          transaction_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [ledgers, total] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        include: {
          medicine: {
            select: { name: true, manufacturer: true },
          },
          creator: {
            select: { full_name: true },
          },
        },
        orderBy: { transaction_date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.stockLedger.count({ where }),
    ]);

    return { ledgers, total };
  }

  /* ============================================
     STOCK ADJUSTMENT
  ============================================ */
  async createStockAdjustment(data, userId) {
    const {
      shopId,
      branchId,
      medicineId,
      inventoryId,
      batchNumber,
      newQuantity,
      reason,
      reasonNotes,
      adjustmentDate,
    } = data;

    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId },
      });

      if (!inventory) {
        throw new ApiError("Inventory not found", 404, "NOT_FOUND");
      }

      const oldQty = Number(inventory.current_stock);
      const newQty = Number(newQuantity);
      const variance = newQty - oldQty;

      const adjustment = await tx.stockAdjustment.create({
        data: {
          shop_id: shopId,
          branch_id: branchId,
          medicine_id: medicineId,
          inventory_id: inventoryId,
          batch_number: batchNumber,
          reason,
          reason_notes: reasonNotes,
          old_quantity: oldQty,
          new_quantity: newQty,
          variance,
          adjustment_date: adjustmentDate ? new Date(adjustmentDate) : new Date(),
          created_by: userId,
        },
      });

      if (variance !== 0) {
        await this.updateStock(
          {
            inventoryId,
            shopId,
            branchId,
            medicineId,
            batchNumber,
            movementType: "STOCK_ADJUSTMENT",
            quantityIn: variance > 0 ? variance : 0,
            quantityOut: variance < 0 ? Math.abs(variance) : 0,
            referenceType: "STOCK_ADJUSTMENT",
            referenceId: adjustment.adjustment_id,
            referenceNumber: `ADJ-${adjustment.adjustment_id.slice(-8)}`,
            transactionDate: adjustmentDate,
            remarks: `${reason}${reasonNotes ? ` - ${reasonNotes}` : ""}`,
          },
          userId
        );
      }

      return adjustment;
    });
  }

  /* ============================================
     STOCK SUMMARY
  ============================================ */
  async getStockSummary(shopId, branchId = null) {
    const baseWhere = {
      shop_id: shopId,
      ...(branchId && { branch_id: branchId }),
      is_active: true,
    };

    const [totalItems, totalQty, lowStock, expiringSoon, expired] =
      await Promise.all([
        prisma.inventory.count({
          where: { ...baseWhere, current_stock: { gt: 0 } },
        }),

        prisma.inventory.aggregate({
          where: { ...baseWhere, current_stock: { gt: 0 } },
          _sum: { current_stock: true },
        }),

        prisma.inventory.count({
          where: { ...baseWhere, minimum_stock: { not: null } },
        }),

        prisma.inventory.count({
          where: {
            ...baseWhere,
            is_expired: false,
            expiry_date: {
              gte: new Date(),
              lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        prisma.inventory.count({
          where: {
            ...baseWhere,
            expiry_date: { lt: new Date() },
            current_stock: { gt: 0 },
          },
        }),
      ]);

    return {
      totalItems,
      totalStockQuantity: totalQty._sum.current_stock || 0,
      lowStockCount: lowStock,
      expiringSoonCount: expiringSoon,
      expiredCount: expired,
    };
  }

  /* ============================================
     MARK EXPIRED ITEMS (CRON SAFE)
  ============================================ */
  async markExpiredItems(shopId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.inventory.updateMany({
      where: {
        shop_id: shopId,
        expiry_date: { lt: today },
        is_expired: false,
      },
      data: { is_expired: true },
    });
  }
}

export default new InventoryService();
