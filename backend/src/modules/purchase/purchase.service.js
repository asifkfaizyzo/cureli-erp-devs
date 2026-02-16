// backend/src/modules/purchase/purchase.service.js

import prisma from "../../config/prisma.js";
import inventoryService from "../inventory/inventory.service.js";
import * as audit from "../audit/index.js";
import {
  PAYMENT_BALANCE_THRESHOLD,
  buildBranchFilter,
  calculatePaymentStatus,
  calculateLineItemForDB,
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from "./purchase.helpers.js";

// ============================================
// CREATE PURCHASE INVOICE
// ============================================

export async function createPurchaseInvoice(userId, shopId, branchId, data, auditContext) {
  const { supplier_id, invoice_date, lineItems, paid_amount, payment_mode, ...invoiceData } = data;

  if (!branchId) {
    const err = new Error("Branch selection is required to create purchase invoices. Please select a specific branch.");
    err.code = "BRANCH_REQUIRED";
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const supplier = await prisma.supplier.findFirst({
    where: { supplier_id, shop_id: shopId, is_active: true },
  });

  if (!supplier) {
    const err = new Error("Supplier not found or inactive");
    err.code = "NOT_FOUND";
    throw err;
  }

  const medicineIds = lineItems.map((item) => item.medicine_id);

// ✅ NEW: Get unique medicine IDs (same medicine with different batches is OK)
const uniqueMedicineIds = [...new Set(medicineIds)];

const medicines = await prisma.medicine.findMany({
  where: { 
    medicine_id: { in: uniqueMedicineIds }, // ✅ Use unique IDs
    shop_id: shopId, 
    branch_id: branchId,
    is_active: true 
  },
});

if (medicines.length !== uniqueMedicineIds.length) { // ✅ Compare with unique count
  const foundIds = medicines.map(m => m.medicine_id);
  const missingIds = uniqueMedicineIds.filter(id => !foundIds.includes(id));
  
  // ✅ NEW: Check if medicines exist in other branches
  const otherBranchMeds = await prisma.medicine.findMany({
    where: {
      medicine_id: { in: missingIds },
      shop_id: shopId,
      is_active: true,
    },
    select: { medicine_id: true, name: true, branch_id: true },
  });

  if (otherBranchMeds.length > 0) {
    const details = otherBranchMeds
      .slice(0, 3)
      .map(m => `"${m.name}"`)
      .join(', ');
    const more = otherBranchMeds.length > 3 ? ` and ${otherBranchMeds.length - 3} more` : '';
    
    const err = new Error(
      `${otherBranchMeds.length} medicine(s) belong to a different branch: ${details}${more}. ` +
      `Please add these medicines to the current branch first, or switch to the correct branch.`
    );
    err.code = "BRANCH_MISMATCH";
    throw err;
  }

  // ✅ NEW: Check if medicines exist at all
  const existingMeds = await prisma.medicine.findMany({
    where: {
      medicine_id: { in: missingIds },
    },
    select: { medicine_id: true, name: true },
  });

  if (existingMeds.length === 0) {
    const err = new Error(
      `${missingIds.length} medicine(s) not found in database. ` +
      `Medicine IDs: ${missingIds.slice(0, 3).join(', ')}${missingIds.length > 3 ? '...' : ''}. ` +
      `Please add these products to the master list first.`
    );
    err.code = "INVALID_MEDICINE";
    throw err;
  }

  const err = new Error(
    `${missingIds.length} medicine(s) are invalid or don't belong to this shop. ` +
    `Please verify the products and try again.`
  );
  err.code = "INVALID_MEDICINE";
  throw err;
}

  const invoiceNumber = await generateInvoiceNumber(shopId);
  const calculations = calculateInvoiceTotals(lineItems);

  const paidAmt = parseFloat(paid_amount) || 0;
  const netAmt = calculations.net_amount;
  const paymentCalc = calculatePaymentStatus(paidAmt, netAmt, PAYMENT_BALANCE_THRESHOLD);

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.purchaseInvoice.create({
      data: {
        ...invoiceData,
        invoice_number: invoiceNumber,
        shop_id: shopId,
        branch_id: branchId,
        supplier_id,
        invoice_date: new Date(invoice_date),
        created_by: userId,
        subtotal: calculations.subtotal,
        discount_amount: calculations.discount_amount,
        taxable_amount: calculations.taxable_amount,
        cgst_amount: calculations.cgst_amount,
        sgst_amount: calculations.sgst_amount,
        igst_amount: calculations.igst_amount,
        total_tax: calculations.total_tax,
        round_off: calculations.round_off,
        net_amount: netAmt,
        payment_status: paymentCalc.status,
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_mode: payment_mode || null,
        status: "DRAFT",
      },
    });

    const items = await Promise.all(
      lineItems.map((item) => {
        const itemCalc = calculateLineItemForDB(item);

        return tx.purchaseInvoiceItem.create({
          data: {
            invoice_id: invoice.invoice_id,
            medicine_id: item.medicine_id,
            batch_number: item.batch_number,
            expiry_date: new Date(item.expiry_date),
            manufacturing_date: item.manufacturing_date
              ? new Date(item.manufacturing_date)
              : null,
            quantity: item.quantity,
            free_quantity: item.free_quantity || 0,
            pack_size: item.pack_size || null,
            unit_of_measure: item.unit_of_measure || "UNIT",
            purchase_rate: item.purchase_rate,
            mrp: item.mrp,
            scheme_discount: item.scheme_discount || 0,
            trade_discount: item.trade_discount || 0,
            cgst_percent: item.cgst_percent || 0,
            sgst_percent: item.sgst_percent || 0,
            igst_percent: item.igst_percent || 0,
            selling_rate: item.selling_rate || null,
            margin_percent: item.margin_percent || null,
            rack_no: item.rack_no || null,
            discount_amount: itemCalc.discount_amount,
            taxable_amount: itemCalc.taxable_amount,
            cgst_amount: itemCalc.cgst_amount,
            sgst_amount: itemCalc.sgst_amount,
            igst_amount: itemCalc.igst_amount,
            line_total: itemCalc.line_total,
          },
        });
      })
    );

    if (paidAmt > 0) {
      await tx.purchasePayment.create({
        data: {
          invoice_id: invoice.invoice_id,
          shop_id: shopId,
          supplier_id,
          payment_date: new Date(invoice_date),
          amount: paidAmt,
          payment_mode: payment_mode || "CASH",
          status: "COMPLETED",
          created_by: userId,
          remarks: paymentCalc.status === "PAID" && paidAmt < netAmt 
            ? `Full payment (balance ₹${(netAmt - paidAmt).toFixed(2)} within threshold)` 
            : "Initial payment on invoice creation",
        },
      });
    }

    return { ...invoice, lineItems: items };
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_CREATED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: result.invoice_id,
    shop_id: shopId,
    branch_id: branchId,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: result.invoice_number,
      supplier_id,
      supplier_name: supplier.name,
      item_count: lineItems.length,
      total_amount: result.net_amount,
      paid_amount: paidAmt,
      payment_status: paymentCalc.status,
    },
  });

  return result;
}

// ============================================
// CONFIRM PURCHASE INVOICE & UPDATE STOCK
// ============================================

export async function confirmPurchaseInvoice(userId, shopId, branchId, invoiceId, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { invoice_id: invoiceId, shop_id: shopId },
    include: { lineItems: true, supplier: true },
  });

  if (!invoice) {
    const err = new Error("Invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (user.role !== "super_admin" && invoice.branch_id !== branchId) {
    const err = new Error("You don't have access to confirm this invoice");
    err.code = "BRANCH_ACCESS_DENIED";
    throw err;
  }

  if (invoice.status === "CONFIRMED") {
    const err = new Error("Invoice already confirmed");
    err.code = "ALREADY_CONFIRMED";
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cannot confirm cancelled invoice");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  const invoiceBranchId = invoice.branch_id;

  // ✅ OPTION 3: Single transaction for confirm + stock update
  const result = await prisma.$transaction(async (tx) => {
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: "CONFIRMED",
        confirmed_by: userId,
        confirmed_at: new Date(),
      },
    });

    for (const item of invoice.lineItems) {
      const inventory = await inventoryService.getOrCreateInventory(
        shopId,
        invoiceBranchId,
        item.medicine_id,
        item.batch_number,
        item.expiry_date,
        item.mrp
      );

      const totalQuantity = Number(item.quantity) + Number(item.free_quantity || 0);

      // ✅ PASS TRANSACTION TO updateStock
      await inventoryService.updateStock(
        {
          inventoryId: inventory.inventory_id,
          shopId: shopId,
          branchId: invoiceBranchId,
          medicineId: item.medicine_id,
          batchNumber: item.batch_number,
          movementType: "PURCHASE",
          quantityIn: totalQuantity,
          quantityOut: 0,
          rate: item.purchase_rate,
          referenceType: "PURCHASE_INVOICE",
          referenceId: invoice.invoice_id,
          referenceNumber: invoice.invoice_number,
          transactionDate: invoice.invoice_date,
          remarks: `Purchase from ${invoice.supplier_invoice_no || invoice.invoice_number}`,
        },
        userId,
        tx  // ✅ CRITICAL: Pass transaction
      );

      await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: {
          last_purchase_rate: item.purchase_rate,
          last_purchase_date: invoice.invoice_date,
          selling_rate: item.selling_rate,
          rack_no: item.rack_no || inventory.rack_no,
        },
      });

      await tx.purchaseInvoiceItem.update({
        where: { item_id: item.item_id },
        data: {
          inventory_id: inventory.inventory_id,
        },
      });
    }

    return updatedInvoice;
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_CONFIRMED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoiceBranchId,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      supplier_name: invoice.supplier.name,
      item_count: invoice.lineItems.length,
      total_amount: invoice.net_amount,
    },
  });

  return result;
}


// ============================================
// GET PURCHASE INVOICES
// ============================================

export async function getPurchaseInvoices(shopId, branchId, role, branchMode, filters = {}) {
  const {
    startDate,
    endDate,
    supplierId,
    status,
    paymentStatus,
    limit = 50,
    offset = 0,
  } = filters;

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const where = {
    ...baseFilter,
    is_return: false,
    ...(supplierId && { supplier_id: supplierId }),
    ...(status && { status }),
    ...(paymentStatus && { payment_status: paymentStatus }),
    ...(startDate &&
      endDate && {
        invoice_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
  };

  const [invoices, total] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where,
      include: {
        supplier: {
          select: {
            name: true,
            gst_number: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        creator: {
          select: {
            full_name: true,
          },
        },
        lineItems: {
          select: {
            item_id: true,
          },
        },
      },
      orderBy: { invoice_date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  const transformedInvoices = invoices.map(invoice => ({
    ...invoice,
    _count: {
      lineItems: invoice.lineItems?.length || 0,
    },
    lineItems: undefined,
  }));

  return { invoices: transformedInvoices, total };
}

// ============================================
// GET INVOICE DETAILS
// ============================================

export async function getInvoiceDetails(invoiceId, shopId, branchId, role, branchMode) {
  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { 
      invoice_id: invoiceId, 
      ...baseFilter,
    },
    include: {
      supplier: {
        select: {
          supplier_id: true,
          name: true,
          supplier_code: true,
          contact_person: true,
          office_phone: true,
          personal_phone: true,
          email: true,
          address_line_1: true,
          address_line_2: true,
          city: true,
          state: true,
          pincode: true,
          gst_number: true,
          pan_number: true,
          drug_license_no: true,
          credit_days: true,
          credit_limit: true,
        },
      },
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
          branch_type: true,
          address_line_1: true,
          city: true,
          state: true,
        },
      },
      lineItems: {
        include: {
          medicine: {
            select: {
              medicine_id: true,
              name: true,
              generic_name: true,
              manufacturer: true,
              category: true,
              sub_category: true,
              hsn_code: true,
              pack_size: true,
              schedule: true,
            },
          },
          inventory: {
            select: {
              inventory_id: true,
              current_stock: true,
              available_stock: true,
              selling_rate: true,
              rack_no: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      },
      payments: {
        select: {
          payment_id: true,
          payment_date: true,
          amount: true,
          payment_mode: true,
          reference_number: true,
          bank_name: true,
          status: true,
          remarks: true,
          created_at: true,
        },
        orderBy: {
          payment_date: 'desc',
        },
      },
      creator: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
      confirmer: {
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  return invoice;
}

// ============================================
// GET PURCHASE STATISTICS
// ============================================

export async function getPurchaseStats(shopId, branchId, role, branchMode, filters = {}) {
  const { startDate, endDate } = filters;

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const where = {
    ...baseFilter,
    status: "CONFIRMED",
    is_return: false,
    ...(startDate &&
      endDate && {
        invoice_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
  };

  const [totalInvoices, totalAmount, unpaidAmount] = await Promise.all([
    prisma.purchaseInvoice.count({ where }),
    prisma.purchaseInvoice.aggregate({
      where,
      _sum: { net_amount: true },
    }),
    prisma.purchaseInvoice.aggregate({
      where: {
        ...where,
        payment_status: { not: "PAID" },
      },
      _sum: { balance_amount: true },
    }),
  ]);

  return {
    totalInvoices,
    totalAmount: totalAmount._sum.net_amount || 0,
    unpaidAmount: unpaidAmount._sum.balance_amount || 0,
  };
}