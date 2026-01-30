// backend/src/modules/inventory/inventory.service.js

import prisma from "../../config/prisma.js";
import { notify } from "../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";

/* =====================================================
   Custom Error
===================================================== */
class ApiError extends Error {
  constructor(message, statusCode = 400, code = "INVENTORY_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/* =====================================================
   HELPER: Build Branch Filter
===================================================== */
function buildBranchFilter(shopId, branchId, role, branchMode) {
  const filter = { shop_id: shopId };

  // Super Admin in GLOBAL mode: show all for shop
  if (role === "super_admin" && branchMode === "GLOBAL") {
    return filter;
  }

  // Super Admin in BRANCH mode OR branch_admin/staff: filter by branch
  if (branchId) {
    filter.branch_id = branchId;
  }

  return filter;
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
     CHECK AND SEND STOCK ALERTS (HELPER)
  ============================================ */
  async checkAndSendStockAlerts(inventory, medicine, branch) {
    const currentStock = Number(inventory.current_stock);
    const minimumStock = Number(inventory.minimum_stock || 0);

    // ✅ OUT OF STOCK ALERT
    if (currentStock === 0 && inventory.minimum_stock !== null) {
      notify({
        type: NOTIFICATION_EVENTS.OUT_OF_STOCK_ALERT,
        context: {
          shop_id: inventory.shop_id,
          branch_id: inventory.branch_id,
          inventory_id: inventory.inventory_id,
          medicine_name: medicine.name,
          batch_number: inventory.batch_number,
          branch_name: branch?.branch_name || null,
        },
      }).catch(err => console.error('[Notification] OUT_OF_STOCK_ALERT failed:', err));
    }
    // ✅ LOW STOCK ALERT
    else if (
      currentStock > 0 &&
      inventory.minimum_stock !== null &&
      currentStock <= minimumStock
    ) {
      notify({
        type: NOTIFICATION_EVENTS.LOW_STOCK_ALERT,
        context: {
          shop_id: inventory.shop_id,
          branch_id: inventory.branch_id,
          inventory_id: inventory.inventory_id,
          medicine_name: medicine.name,
          batch_number: inventory.batch_number,
          current_stock: currentStock,
          minimum_stock: minimumStock,
          branch_name: branch?.branch_name || null,
        },
      }).catch(err => console.error('[Notification] LOW_STOCK_ALERT failed:', err));
    }
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
        include: {
          medicine: {
            select: { name: true },
          },
          branch: {
            select: { branch_name: true },
          },
        },
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

      // ✅ Check and send stock alerts after transaction commits (fire-and-forget)
      // Use setImmediate to ensure transaction completes first
      setImmediate(() => {
        this.checkAndSendStockAlerts(
          { ...updatedInventory, inventory_id: inventoryId },
          inventory.medicine,
          inventory.branch
        );
      });

      return { inventory: updatedInventory, ledgerEntry };
    });
  }

  /* ============================================
     GET INVENTORY LIST - ✅ BRANCH AWARE
  ============================================ */
  async getInventory(shopId, branchId, role, branchMode, filters = {}) {
    const {
      medicineId,
      search,
      includeExpired = false,
      lowStock = false,
      limit = 100,
      offset = 0,
    } = filters;

    // ✅ Build branch filter
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    console.log("📦 Inventory filter:", { baseFilter, branchMode, branchId, role });

    const where = {
      ...baseFilter,
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
            branch_id: true,  // ✅ Include medicine's branch for verification
          },
        },
        branch: {
          select: {
            branch_id: true,
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

    // Map and add supplier_name
    let inventories = rawInventories.map((inv) => {
      const supplierName = inv.stockMovements?.[0]?.purchaseInvoice?.supplier?.name || null;
      const { stockMovements, ...rest } = inv;
      
      return {
        ...rest,
        supplier_name: supplierName,
      };
    });

    // Apply low stock filter in memory if needed
    if (lowStock) {
      inventories = inventories.filter(
        (inv) =>
          inv.minimum_stock !== null &&
          Number(inv.current_stock) <= Number(inv.minimum_stock)
      );
    }

    const total = await prisma.inventory.count({ where });

    console.log(`📦 Found ${inventories.length} inventory items (total: ${total})`);

    return { inventories, total };
  }

  /* ============================================
     INVENTORY BY MEDICINE - ✅ BRANCH AWARE
  ============================================ */
  async getInventoryByMedicine(shopId, medicineId, branchId, role, branchMode, filters = {}) {
    const { includeExpired = false } = filters;

    // ✅ Build branch filter
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    return prisma.inventory.findMany({
      where: {
        ...baseFilter,
        medicine_id: medicineId,
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
            branch_id: true,
            branch_name: true,
          },
        },
      },
      orderBy: [{ expiry_date: "asc" }, { batch_number: "asc" }],
    });
  }

  /* ============================================
     LOW STOCK ITEMS - ✅ BRANCH AWARE
  ============================================ */
  async getLowStockItems(shopId, branchId, role, branchMode) {
    // ✅ Build branch filter
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const inventories = await prisma.inventory.findMany({
      where: {
        ...baseFilter,
        is_active: true,
        is_expired: false,
        minimum_stock: { not: null },
      },
      include: {
        medicine: {
          select: { name: true, manufacturer: true },
        },
        branch: {
          select: { branch_id: true, branch_name: true },
        },
      },
    });

    return inventories.filter(
      (inv) => Number(inv.current_stock) <= Number(inv.minimum_stock || 0)
    );
  }

  /* ============================================
     EXPIRING SOON - ✅ BRANCH AWARE
  ============================================ */
  async getExpiringSoonItems(shopId, daysAhead = 90, branchId, role, branchMode) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // ✅ Build branch filter
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    return prisma.inventory.findMany({
      where: {
        ...baseFilter,
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
          select: { branch_id: true, branch_name: true },
        },
      },
      orderBy: { expiry_date: "asc" },
    });
  }

  /* ============================================
     STOCK LEDGER - ✅ BRANCH AWARE
  ============================================ */
  async getStockLedger(shopId, branchId, role, branchMode, filters = {}) {
    const {
      medicineId,
      batchNumber,
      movementType,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = filters;

    // ✅ Build branch filter
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
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
          branch: {
            select: { branch_id: true, branch_name: true },
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
     STOCK ADJUSTMENT - Branch Required
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

    // ✅ Validate branch is provided
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required for stock adjustments",
        400,
        "BRANCH_REQUIRED"
      );
    }

    return prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: { inventory_id: inventoryId },
        include: {
          medicine: {
            select: { name: true },
          },
          branch: {
            select: { branch_name: true },
          },
        },
      });

      if (!inventory) {
        throw new ApiError("Inventory not found", 404, "NOT_FOUND");
      }

      // ✅ Validate inventory belongs to the selected branch
      if (inventory.branch_id !== branchId) {
        throw new ApiError(
          "This inventory item belongs to a different branch",
          403,
          "BRANCH_MISMATCH"
        );
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
      } else {
        // Even if no variance, check alerts in case minimum_stock was changed elsewhere
        setImmediate(() => {
          this.checkAndSendStockAlerts(inventory, inventory.medicine, inventory.branch);
        });
      }

      return adjustment;
    });
  }

  /* ============================================
     STOCK SUMMARY - ✅ BRANCH AWARE
  ============================================ */
  async getStockSummary(shopId, branchId, role, branchMode) {
    // ✅ Build branch filter
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const baseWhere = {
      ...baseFilter,
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
     ✅ UPDATED: Send expired stock alerts
  ============================================ */
  async markExpiredItems(shopId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find items that are expiring today and have stock
    const expiringItems = await prisma.inventory.findMany({
      where: {
        shop_id: shopId,
        expiry_date: { lt: today },
        is_expired: false,
        current_stock: { gt: 0 },
      },
      include: {
        medicine: {
          select: { name: true },
        },
        branch: {
          select: { branch_name: true },
        },
      },
    });

    // Mark them as expired
    const updateResult = await prisma.inventory.updateMany({
      where: {
        shop_id: shopId,
        expiry_date: { lt: today },
        is_expired: false,
      },
      data: { is_expired: true },
    });

    // ✅ Send expired stock alerts for items with stock (fire-and-forget)
    expiringItems.forEach((item) => {
      notify({
        type: NOTIFICATION_EVENTS.EXPIRED_STOCK_ALERT,
        context: {
          shop_id: item.shop_id,
          branch_id: item.branch_id,
          inventory_id: item.inventory_id,
          medicine_name: item.medicine.name,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date.toISOString().split('T')[0],
          current_stock: Number(item.current_stock),
          branch_name: item.branch?.branch_name || null,
        },
      }).catch(err => console.error('[Notification] EXPIRED_STOCK_ALERT failed:', err));
    });

    return updateResult;
  }

  /* ============================================
     ✅ NEW: SEND NEAR EXPIRY ALERTS (FOR CRON)
     Call this from a scheduled job to check items expiring soon
  ============================================ */
  async sendNearExpiryAlerts(shopId, daysAhead = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const expiringItems = await prisma.inventory.findMany({
      where: {
        shop_id: shopId,
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
          select: { name: true },
        },
        branch: {
          select: { branch_name: true },
        },
      },
    });

    // Send alerts (fire-and-forget, deduplication handled by notification system)
    expiringItems.forEach((item) => {
      const daysUntilExpiry = Math.ceil(
        (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      notify({
        type: NOTIFICATION_EVENTS.NEAR_EXPIRY_ALERT,
        context: {
          shop_id: item.shop_id,
          branch_id: item.branch_id,
          inventory_id: item.inventory_id,
          medicine_name: item.medicine.name,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date.toISOString().split('T')[0],
          days_until_expiry: daysUntilExpiry,
          current_stock: Number(item.current_stock),
          branch_name: item.branch?.branch_name || null,
        },
      }).catch(err => console.error('[Notification] NEAR_EXPIRY_ALERT failed:', err));
    });

    return { sent: expiringItems.length };
  }
}

export default new InventoryService();
