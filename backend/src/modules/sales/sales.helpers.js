// backend/src/modules/sales/sales.helpers.js

import prisma from "../../config/prisma.js";

// ============================================
// CONSTANTS
// ============================================

export const PAYMENT_BALANCE_THRESHOLD = 1; // ₹1 tolerance for rounding

export const PAYMENT_MODES = {
  CASH: "CASH",
  CARD: "CARD",
  UPI: "UPI",
  CREDIT: "CREDIT",
};

export const INVOICE_STATUS = {
  DRAFT: "DRAFT",
  PARKED: "PARKED",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
};

export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
};

// ============================================
// HELPER: Build Branch Filter
// ============================================

export function buildBranchFilter(shopId, branchId, role, branchMode) {
  const filter = { shop_id: shopId };

  if (role === "super_admin" && branchMode === "GLOBAL") {
    return filter;
  }

  if (branchId) {
    filter.branch_id = branchId;
  }

  return filter;
}

// ============================================
// HELPER: Calculate Line Item
// ============================================

// ============================================
// HELPER: Calculate Line Item (GST-INCLUSIVE)
// ============================================

export function calculateLineItem(item) {
  const qty = parseFloat(item.quantity || 0);
  
  // ✅ CRITICAL: Use selling_rate instead of mrp
  const inclusiveRate = parseFloat(item.selling_rate || item.mrp || 0);
  const discountPercent = parseFloat(item.discount_percent || 0);

  // Gross amount (GST-inclusive)
  const grossAmount = qty * inclusiveRate;

  // Item discount
  const discountAmount = (grossAmount * discountPercent) / 100;

  // Amount after discount (still GST-inclusive)
  const amountAfterDiscount = grossAmount - discountAmount;

  // ✅ Back-calculate GST (prices are inclusive)
  const cgstPercent = parseFloat(item.cgst_percent || 0);
  const sgstPercent = parseFloat(item.sgst_percent || 0);
  const totalGstPercent = cgstPercent + sgstPercent;

  // Taxable amount = Amount / (1 + GST%)
  const taxableAmount = amountAfterDiscount / (1 + totalGstPercent / 100);

  // Tax amounts (for display, already included)
  const cgstAmount = (taxableAmount * cgstPercent) / 100;
  const sgstAmount = (taxableAmount * sgstPercent) / 100;

  // ✅ Line total = Amount after discount (tax already included, NOT added again)
  const lineTotal = amountAfterDiscount;

  return {
    gross_amount: Number(grossAmount.toFixed(2)),
    discount_amount: Number(discountAmount.toFixed(2)),
    taxable_amount: Number(taxableAmount.toFixed(2)),
    cgst_amount: Number(cgstAmount.toFixed(2)),
    sgst_amount: Number(sgstAmount.toFixed(2)),
    line_total: Number(lineTotal.toFixed(2)),
  };
}

// ============================================
// HELPER: Calculate Invoice Totals
// ============================================


export function calculateInvoiceTotals(lineItems, customerDiscountPercent = 0, billDiscountPercent = 0) {
  let subtotal = 0;
  let itemDiscountAmount = 0;
  let totalTaxableAmount = 0;
  let totalCgstAmount = 0;
  let totalSgstAmount = 0;

  // Sum up line items
  lineItems.forEach((item) => {
    const qty = parseFloat(item.quantity || 0);
    
    // ✅ CRITICAL: Use selling_rate instead of mrp
    const inclusiveRate = parseFloat(item.selling_rate || item.mrp || 0);
    const discountPercent = parseFloat(item.discount_percent || 0);

    const grossAmount = qty * inclusiveRate;
    const itemDiscount = (grossAmount * discountPercent) / 100;
    const amountAfterItemDiscount = grossAmount - itemDiscount;

    // Back-calculate tax
    const cgstPct = parseFloat(item.cgst_percent || 0);
    const sgstPct = parseFloat(item.sgst_percent || 0);
    const totalGstPct = cgstPct + sgstPct;
    
    const itemTaxable = amountAfterItemDiscount / (1 + totalGstPct / 100);
    const itemCgst = (itemTaxable * cgstPct) / 100;
    const itemSgst = (itemTaxable * sgstPct) / 100;

    subtotal += grossAmount;
    itemDiscountAmount += itemDiscount;
    totalTaxableAmount += itemTaxable;
    totalCgstAmount += itemCgst;
    totalSgstAmount += itemSgst;
  });

  // Customer discount
  const afterItemDiscount = subtotal - itemDiscountAmount;
  const customerDiscountAmount = (afterItemDiscount * customerDiscountPercent) / 100;

  // Bill discount
  const afterCustomerDiscount = afterItemDiscount - customerDiscountAmount;
  const billDiscountAmount = (afterCustomerDiscount * billDiscountPercent) / 100;

  // Total discount
  const totalDiscount = itemDiscountAmount + customerDiscountAmount + billDiscountAmount;

  // Final net (already inclusive)
  const netAmountBeforeRounding = subtotal - totalDiscount;

  // Recalculate tax proportionally
  const discountRatio = afterItemDiscount > 0 ? netAmountBeforeRounding / afterItemDiscount : 0;
  const finalTaxableAmount = totalTaxableAmount * discountRatio;
  const finalCgstAmount = totalCgstAmount * discountRatio;
  const finalSgstAmount = totalSgstAmount * discountRatio;
  const totalTax = finalCgstAmount + finalSgstAmount;

  // Round off
  const roundOff = Math.round(netAmountBeforeRounding) - netAmountBeforeRounding;
  const netAmount = Math.round(netAmountBeforeRounding);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    item_discount_amount: Number(itemDiscountAmount.toFixed(2)),
    customer_discount_percent: Number(customerDiscountPercent.toFixed(2)),
    customer_discount_amount: Number(customerDiscountAmount.toFixed(2)),
    bill_discount_percent: Number(billDiscountPercent.toFixed(2)),
    bill_discount_amount: Number(billDiscountAmount.toFixed(2)),
    total_discount: Number(totalDiscount.toFixed(2)),
    taxable_amount: Number(finalTaxableAmount.toFixed(2)),
    cgst_amount: Number(finalCgstAmount.toFixed(2)),
    sgst_amount: Number(finalSgstAmount.toFixed(2)),
    total_tax: Number(totalTax.toFixed(2)),
    round_off: Number(roundOff.toFixed(2)),
    net_amount: netAmount,
    balance_amount: netAmount,
  };
}
// ============================================
// HELPER: Calculate Payment Status
// ============================================

export function calculatePaymentStatus(paidAmount, netAmount, threshold = PAYMENT_BALANCE_THRESHOLD) {
  const paid = parseFloat(paidAmount) || 0;
  const net = parseFloat(netAmount) || 0;
  const balance = net - paid;

  if (paid <= 0) {
    return {
      status: PAYMENT_STATUS.UNPAID,
      paidAmount: 0,
      balanceAmount: net,
    };
  }

  if (balance <= threshold) {
    return {
      status: PAYMENT_STATUS.PAID,
      paidAmount: net,
      balanceAmount: 0,
    };
  }

  return {
    status: PAYMENT_STATUS.PARTIALLY_PAID,
    paidAmount: paid,
    balanceAmount: balance,
  };
}

// ============================================
// HELPER: Generate Sales Invoice Number
// Branch-level sequence: SALE-{BranchCode}-{Sequence}
// ============================================

export async function generateSalesInvoiceNumber(shopId, branchId) {
  // Get branch code
  const branch = await prisma.branch.findUnique({
    where: { branch_id: branchId },
    select: { branch_name: true },
  });

  // Create short branch code (first 3 chars uppercase)
  const branchCode = branch?.branch_name
    ? branch.branch_name.substring(0, 3).toUpperCase().replace(/\s/g, "")
    : "BR1";

  // Get last invoice for this branch
  const lastInvoice = await prisma.salesInvoice.findFirst({
    where: {
      shop_id: shopId,
      branch_id: branchId,
      is_return: false,
    },
    orderBy: { created_at: "desc" },
    select: { invoice_number: true },
  });

  let nextNumber = 1;

  if (lastInvoice) {
    // Extract number from SALE-XXX-000001 format
    const parts = lastInvoice.invoice_number.split("-");
    if (parts.length >= 3) {
      nextNumber = parseInt(parts[2]) + 1;
    }
  }

  return `SALE-${branchCode}-${String(nextNumber).padStart(6, "0")}`;
}

// ============================================
// HELPER: Generate Sales Return Invoice Number
// ============================================

export async function generateSalesReturnNumber(shopId, branchId) {
  const branch = await prisma.branch.findUnique({
    where: { branch_id: branchId },
    select: { branch_name: true },
  });

  const branchCode = branch?.branch_name
    ? branch.branch_name.substring(0, 3).toUpperCase().replace(/\s/g, "")
    : "BR1";

  const lastReturn = await prisma.salesInvoice.findFirst({
    where: {
      shop_id: shopId,
      branch_id: branchId,
      is_return: true,
    },
    orderBy: { created_at: "desc" },
    select: { invoice_number: true },
  });

  let nextNumber = 1;

  if (lastReturn) {
    const parts = lastReturn.invoice_number.split("-");
    if (parts.length >= 3) {
      nextNumber = parseInt(parts[2]) + 1;
    }
  }

  return `SRTN-${branchCode}-${String(nextNumber).padStart(6, "0")}`;
}

// ============================================
// HELPER: Check Stock Availability
// ============================================

export async function checkStockAvailability(shopId, branchId, items) {
  const errors = [];

  for (const item of items) {
    const inventory = await prisma.inventory.findFirst({
      where: {
        inventory_id: item.inventory_id,
        shop_id: shopId,
        branch_id: branchId,
        is_active: true,
      },
      include: {
        medicine: {
          select: { name: true },
        },
      },
    });

    if (!inventory) {
      errors.push({
        inventory_id: item.inventory_id,
        error: "Inventory batch not found",
      });
      continue;
    }

    const availableStock = parseFloat(inventory.available_stock);
    const requestedQty = parseFloat(item.quantity);

    if (availableStock < requestedQty) {
      errors.push({
        inventory_id: item.inventory_id,
        medicine_name: inventory.medicine.name,
        batch_number: inventory.batch_number,
        available: availableStock,
        requested: requestedQty,
        error: `Insufficient stock. Available: ${availableStock}, Requested: ${requestedQty}`,
      });
    }

    // Check expiry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(inventory.expiry_date);

    if (expiryDate < today) {
      errors.push({
        inventory_id: item.inventory_id,
        medicine_name: inventory.medicine.name,
        batch_number: inventory.batch_number,
        error: `Batch ${inventory.batch_number} has expired on ${expiryDate.toISOString().split("T")[0]}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================
// HELPER: Reserve Stock (for DRAFT invoices)
// ============================================

export async function reserveStock(tx, shopId, branchId, items, invoiceId) {
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({
      where: { inventory_id: item.inventory_id },
    });

    if (!inventory) {
      throw new Error(`Inventory not found: ${item.inventory_id}`);
    }

    const currentReserved = parseFloat(inventory.reserved_stock) || 0;
    const currentAvailable = parseFloat(inventory.available_stock);
    const requestedQty = parseFloat(item.quantity);

    if (currentAvailable < requestedQty) {
      throw new Error(
        `Insufficient available stock for batch ${inventory.batch_number}. ` +
        `Available: ${currentAvailable}, Requested: ${requestedQty}`
      );
    }

    // Update inventory: increase reserved, decrease available
    await tx.inventory.update({
      where: { inventory_id: item.inventory_id },
      data: {
        reserved_stock: currentReserved + requestedQty,
        available_stock: currentAvailable - requestedQty,
      },
    });
  }
}

// ============================================
// HELPER: Release Reserved Stock (for cancelled DRAFT)
// ============================================

export async function releaseReservedStock(tx, items) {
  for (const item of items) {
    const inventory = await tx.inventory.findUnique({
      where: { inventory_id: item.inventory_id },
    });

    if (!inventory) continue;

    const currentReserved = parseFloat(inventory.reserved_stock) || 0;
    const currentAvailable = parseFloat(inventory.available_stock);
    const reservedQty = parseFloat(item.quantity);

    // Release: decrease reserved, increase available
    await tx.inventory.update({
      where: { inventory_id: item.inventory_id },
      data: {
        reserved_stock: Math.max(0, currentReserved - reservedQty),
        available_stock: currentAvailable + reservedQty,
      },
    });
  }
}

// ============================================
// HELPER: Confirm Stock Deduction (DRAFT → CONFIRMED)
// ============================================

export async function confirmStockDeduction(tx, invoice, lineItems, userId) {
  for (const item of lineItems) {
    const inventory = await tx.inventory.findUnique({
      where: { inventory_id: item.inventory_id },
      include: {
        medicine: { select: { name: true } },
      },
    });

    if (!inventory) {
      throw new Error(`Inventory not found: ${item.inventory_id}`);
    }

    const qty = parseFloat(item.quantity);
    const currentStock = parseFloat(inventory.current_stock);
    const currentReserved = parseFloat(inventory.reserved_stock) || 0;

    // Move from reserved to actual deduction
    const newCurrentStock = currentStock - qty;
    const newReservedStock = Math.max(0, currentReserved - qty);

    // Update inventory
    await tx.inventory.update({
      where: { inventory_id: item.inventory_id },
      data: {
        current_stock: newCurrentStock,
        reserved_stock: newReservedStock,
        // available_stock stays same (was already reduced during reservation)
      },
    });

    // Create stock ledger entry
    await tx.stockLedger.create({
      data: {
        shop_id: invoice.shop_id,
        branch_id: invoice.branch_id,
        medicine_id: item.medicine_id,
        inventory_id: item.inventory_id,
        batch_number: item.batch_number,
        expiry_date: new Date(item.expiry_date),
        movement_type: "SALE",
        reference_type: "SALES_INVOICE",
        reference_id: invoice.invoice_id,
        reference_number: invoice.invoice_number,
        quantity_in: 0,
        quantity_out: qty,
        quantity_net: -qty,
        balance_after: newCurrentStock,
        rate: item.mrp,
        amount: parseFloat(item.line_total),
        transaction_date: new Date(invoice.invoice_date),
        created_by: userId,
        remarks: `Sale: ${invoice.invoice_number}`,
      },
    });
  }
}