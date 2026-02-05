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
 
  
  // ✅ Helper to parse Decimal values
  _toNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return isNaN(value) ? null : value;
    if (typeof value === 'string') {
      if (value.trim() === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    if (typeof value === 'object' && value.toString) {
      const num = Number(value.toString());
      return isNaN(num) ? null : num;
    }
    return null;
  }

  /* ============================================
     ✅ CALCULATE STOCK STATUS
     
     YOUR REQUIREMENT:
     - If current_stock < min_stock_level → "Low Stock"
  ============================================ */
  _calculateStockStatus(currentStock, inventoryMinStock, medicineStockLevels, isExpired, expiryDate) {
    const stock = this._toNumber(currentStock) ?? 0;
    
    // Get min_stock_level from Medicine table (what you set in ProductMasterModal)
    const minStockFromMedicine = this._toNumber(medicineStockLevels?.min_stock_level);
    
    // Get minimum_stock from Inventory table (if set at batch level)
    const minStockFromInventory = this._toNumber(inventoryMinStock);
    
    // Use inventory-level if set, otherwise use medicine-level
    const effectiveMinStock = minStockFromInventory ?? minStockFromMedicine;

    // 1. Expired (flag)
    if (isExpired === true) {
      return "Expired";
    }
    
    // 2. Expired (date check)
    if (expiryDate) {
      const expDate = new Date(expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      
      const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry < 0) return "Expired";
      if (daysUntilExpiry <= 30) return "Expiring Soon";
    }

    // 3. Out of Stock
    if (stock === 0) {
      return "Out of Stock";
    }
    
    // 4. ✅ YOUR REQUIREMENT: Low Stock if current_stock < min_stock_level
    if (effectiveMinStock !== null && stock < effectiveMinStock) {
      return "Low Stock";
    }
    
    // 5. Default
    return "In Stock";
  }

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
  /* ============================================
   UPDATE STOCK + LEDGER ENTRY - ✅ FIXED
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
          select: { 
            name: true,
            min_stock_level: true,
            max_stock_level: true,
            reorder_point: true,
          },
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

    // ✅ FIX: Only set reference_id for PURCHASE_INVOICE (due to FK constraint)
    // For other reference types (STOCK_ADJUSTMENT, etc.), reference_id must be null
    const validReferenceId = referenceType === "PURCHASE_INVOICE" ? referenceId : null;

    const ledgerEntry = await tx.stockLedger.create({
      data: {
        shop_id: shopId,
        branch_id: branchId,
        medicine_id: medicineId,
        inventory_id: inventoryId,
        movement_type: movementType,
        reference_type: referenceType,
        reference_id: validReferenceId,  // ✅ FIXED
        reference_number: referenceNumber,  // Keep the ADJ-xxx reference number
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

    setImmediate(() => {
      this.checkAndSendStockAlerts(
        { ...updatedInventory, inventory_id: inventoryId },
        inventory.medicine,
        inventory.branch
      );
    });

    const status = this._calculateStockStatus(
      newStock,
      inventory.minimum_stock,
      {
        min_stock_level: inventory.medicine?.min_stock_level,
        max_stock_level: inventory.medicine?.max_stock_level,
        reorder_point: inventory.medicine?.reorder_point,
      },
      inventory.is_expired,
      inventory.expiry_date
    );

    return { 
      inventory: { ...updatedInventory, status }, 
      ledgerEntry 
    };
  });
}

  /* ============================================
     ✅ GET INVENTORY LIST - COMPLETE WITH ALL FIELDS
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

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const where = {
    ...baseFilter,
    ...(medicineId && { medicine_id: medicineId }),
    is_active: true,
    ...(!includeExpired && { is_expired: false }),
    ...(search && {
      OR: [
        { medicine: { name: { contains: search, mode: "insensitive" } } },
        { medicine: { manufacturer: { contains: search, mode: "insensitive" } } },
        { batch_number: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const rawInventories = await prisma.inventory.findMany({
    where,
    include: {
      medicine: {
        select: {
          medicine_id: true,
          name: true,
          manufacturer: true,
          pack_size: true,
          hsn_code: true,
          category: true,
          sub_category: true,
          schedule: true,
          branch_id: true,
          rack_no: true,
          // ✅ ENSURE THESE ARE SELECTED
          min_stock_level: true,
          max_stock_level: true,
          reorder_point: true,
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
        select: {
          reference_id: true,
        },
      },
    },
    orderBy: [{ expiry_date: "asc" }, { batch_number: "asc" }],
    take: limit,
    skip: offset,
  });

  // ✅ FIXED: Get supplier names in a separate query
  // Extract unique purchase invoice IDs
  const purchaseInvoiceIds = rawInventories
    .flatMap(inv => inv.stockMovements.map(sm => sm.reference_id))
    .filter(Boolean);

  // Fetch purchase invoices with suppliers
  const purchaseInvoices = purchaseInvoiceIds.length > 0
    ? await prisma.purchaseInvoice.findMany({
        where: {
          invoice_id: { in: purchaseInvoiceIds },
        },
        select: {
          invoice_id: true,
          supplier: {
            select: {
              name: true,
            },
          },
        },
      })
    : [];

  // Create a map for quick lookup
  const supplierMap = new Map(
    purchaseInvoices.map(inv => [inv.invoice_id, inv.supplier?.name])
  );

  // Map and flatten all medicine data
  const inventories = rawInventories.map((inv) => {
    // Get supplier name from the first stock movement
    const firstMovementId = inv.stockMovements?.[0]?.reference_id;
    const supplierName = firstMovementId ? supplierMap.get(firstMovementId) : null;
    
    const { stockMovements, ...rest } = inv;
    
    const status = this._calculateStockStatus(
      rest.current_stock,
      rest.minimum_stock,
      {
        min_stock_level: rest.medicine?.min_stock_level,
        max_stock_level: rest.medicine?.max_stock_level,
        reorder_point: rest.medicine?.reorder_point,
      },
      rest.is_expired,
      rest.expiry_date
    );
    
    return {
      ...rest,
      supplier_name: supplierName || null,
      status,
      // Flatten medicine data for easier frontend access
      medicine_name: rest.medicine?.name,
      medicine_manufacturer: rest.medicine?.manufacturer,
      medicine_category: rest.medicine?.category,
      medicine_sub_category: rest.medicine?.sub_category,
      medicine_hsn_code: rest.medicine?.hsn_code,
      medicine_pack_size: rest.medicine?.pack_size,
      medicine_schedule: rest.medicine?.schedule,
      medicine_rack_no: rest.medicine?.rack_no,
      medicine_min_stock: rest.medicine?.min_stock_level,
      medicine_max_stock: rest.medicine?.max_stock_level,
      medicine_reorder_point: rest.medicine?.reorder_point,
    };
  });

  // Apply low stock filter in memory
  let filteredInventories = inventories;
  if (lowStock) {
    filteredInventories = inventories.filter(
      (inv) => inv.status === "Low Stock" || inv.status === "Out of Stock"
    );
  }

  const total = await prisma.inventory.count({ where });

  return { inventories: filteredInventories, total };
}

  /* ============================================
   GET INVENTORY BY MEDICINE - ✅ FIXED
============================================ */
async getInventoryByMedicine(shopId, medicineId, branchId, role, branchMode, filters = {}) {
  const { includeExpired = false } = filters;
  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const inventories = await prisma.inventory.findMany({
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
          // ✅ FIXED: Include stock level fields
          min_stock_level: true,
          max_stock_level: true,
          reorder_point: true,
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

  return inventories.map(inv => ({
    ...inv,
    status: this._calculateStockStatus(
      inv.current_stock,
      inv.minimum_stock,
      {
        min_stock_level: inv.medicine?.min_stock_level,
        max_stock_level: inv.medicine?.max_stock_level,
        reorder_point: inv.medicine?.reorder_point,
      },
      inv.is_expired,
      inv.expiry_date
    ),
  }));
}

/* ============================================
   LOW STOCK ITEMS - ✅ FIXED
============================================ */
async getLowStockItems(shopId, branchId, role, branchMode) {
  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const inventories = await prisma.inventory.findMany({
    where: {
      ...baseFilter,
      is_active: true,
      is_expired: false,
    },
    include: {
      medicine: {
        select: { 
          name: true, 
          manufacturer: true,
          // ✅ FIXED: Include stock level fields
          min_stock_level: true,
          max_stock_level: true,
          reorder_point: true,
        },
      },
      branch: {
        select: { branch_id: true, branch_name: true },
      },
    },
  });

  return inventories
    .map(inv => ({
      ...inv,
      status: this._calculateStockStatus(
        inv.current_stock,
        inv.minimum_stock,
        {
          min_stock_level: inv.medicine?.min_stock_level,
          max_stock_level: inv.medicine?.max_stock_level,
          reorder_point: inv.medicine?.reorder_point,
        },
        inv.is_expired,
        inv.expiry_date
      ),
    }))
    .filter(inv => inv.status === "Low Stock" || inv.status === "Out of Stock");
}

  /* ============================================
     EXPIRING SOON ITEMS
  ============================================ */
 /* ============================================
   EXPIRING SOON ITEMS - ✅ FIXED
============================================ */
async getExpiringSoonItems(shopId, daysAhead = 90, branchId, role, branchMode) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const inventories = await prisma.inventory.findMany({
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
        select: { 
          name: true, 
          manufacturer: true,
          // ✅ FIXED: Include stock level fields
          min_stock_level: true,
          max_stock_level: true,
          reorder_point: true,
        },
      },
      branch: {
        select: { branch_id: true, branch_name: true },
      },
    },
    orderBy: { expiry_date: "asc" },
  });

  return inventories.map(inv => ({
    ...inv,
    status: this._calculateStockStatus(
      inv.current_stock,
      inv.minimum_stock,
      {
        min_stock_level: inv.medicine?.min_stock_level,
        max_stock_level: inv.medicine?.max_stock_level,
        reorder_point: inv.medicine?.reorder_point,
      },
      inv.is_expired,
      inv.expiry_date
    ),
  }));
}

  /* ============================================
     STOCK LEDGER
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
        setImmediate(() => {
          this.checkAndSendStockAlerts(inventory, inventory.medicine, inventory.branch);
        });
      }

      return adjustment;
    });
  }

  /* ============================================
   STOCK SUMMARY - ✅ FIXED
============================================ */
async getStockSummary(shopId, branchId, role, branchMode) {
  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const baseWhere = {
    ...baseFilter,
    is_active: true,
  };

  const allInventories = await prisma.inventory.findMany({
    where: baseWhere,
    include: {
      medicine: {
        select: {
          // ✅ FIXED: Include stock level fields
          min_stock_level: true,
          max_stock_level: true,
          reorder_point: true,
        },
      },
    },
  });

  const inventoriesWithStatus = allInventories.map(inv => ({
    ...inv,
    status: this._calculateStockStatus(
      inv.current_stock,
      inv.minimum_stock,
      {
        min_stock_level: inv.medicine?.min_stock_level,
        max_stock_level: inv.medicine?.max_stock_level,
        reorder_point: inv.medicine?.reorder_point,
      },
      inv.is_expired,
      inv.expiry_date
    ),
  }));

  const totalItems = inventoriesWithStatus.filter(inv => Number(inv.current_stock) > 0).length;
  const totalQty = inventoriesWithStatus.reduce((sum, inv) => sum + Number(inv.current_stock || 0), 0);
  const lowStock = inventoriesWithStatus.filter(inv => inv.status === "Low Stock").length;
  const outOfStock = inventoriesWithStatus.filter(inv => inv.status === "Out of Stock").length;
  const expiringSoon = inventoriesWithStatus.filter(inv => inv.status === "Expiring Soon").length;
  const expired = inventoriesWithStatus.filter(inv => inv.status === "Expired").length;

  return {
    totalItems,
    totalStockQuantity: totalQty,
    lowStockCount: lowStock,
    outOfStockCount: outOfStock,
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

    const updateResult = await prisma.inventory.updateMany({
      where: {
        shop_id: shopId,
        expiry_date: { lt: today },
        is_expired: false,
      },
      data: { is_expired: true },
    });

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
     SEND NEAR EXPIRY ALERTS (FOR CRON)
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