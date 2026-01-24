// backend/src/modules/purchase/purchase.service.js
import prisma from "../../config/prisma.js";
// ✅ CORRECT - This is for default export
import inventoryService from "../inventory/inventory.service.js";
import * as audit from "../audit/index.js";

// ============================================
// CREATE PURCHASE INVOICE
// ============================================

export async function createPurchaseInvoice(userId, shopId, branchId, data, auditContext) {
  const { supplier_id, invoice_date, lineItems, ...invoiceData } = data;

  // Validate user
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Validate supplier belongs to shop
  const supplier = await prisma.supplier.findFirst({
    where: { supplier_id, shop_id: shopId, is_active: true },
  });

  if (!supplier) {
    const err = new Error("Supplier not found or inactive");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Validate medicines
  const medicineIds = lineItems.map((item) => item.medicine_id);
  const medicines = await prisma.medicine.findMany({
    where: { medicine_id: { in: medicineIds }, shop_id: shopId, is_active: true },
  });

  if (medicines.length !== medicineIds.length) {
    const err = new Error("Some medicines are invalid or don't belong to this shop");
    err.code = "INVALID_MEDICINE";
    throw err;
  }

  const invoiceNumber = await generateInvoiceNumber(shopId);
  const calculations = calculateInvoiceTotals(lineItems);

  const result = await prisma.$transaction(async (tx) => {
    // Header
    const invoice = await tx.purchaseInvoice.create({
      data: {
        ...invoiceData,
        invoice_number: invoiceNumber,
        shop_id: shopId,
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
        net_amount: calculations.net_amount,
        balance_amount: calculations.balance_amount,
        status: "DRAFT",
      },
    });

    // Items
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

  const result = await prisma.$transaction(async (tx) => {
    // Update invoice status
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: "CONFIRMED",
        confirmed_by: userId,
        confirmed_at: new Date(),
      },
    });

    // Process each line item - update inventory
    for (const item of invoice.lineItems) {
      // Get or create inventory entry
      const inventory = await inventoryService.getOrCreateInventory(
        shopId,
        invoice.branch_id,
        item.medicine_id,
        item.batch_number,
        item.expiry_date,
        item.mrp
      );

      // Calculate total quantity (purchased + free)
      const totalQuantity = Number(item.quantity) + Number(item.free_quantity || 0);

      // Update stock
      await inventoryService.updateStock(
        {
          inventoryId: inventory.inventory_id,
          shopId: shopId,
          branchId: invoice.branch_id,
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
        userId
      );

      // Update last purchase info and selling rate in inventory
      await tx.inventory.update({
        where: { inventory_id: inventory.inventory_id },
        data: {
          last_purchase_rate: item.purchase_rate,
          last_purchase_date: invoice.invoice_date,
          selling_rate: item.selling_rate,
          rack_no: item.rack_no || inventory.rack_no,
        },
      });

      // Link inventory to purchase item
      await tx.purchaseInvoiceItem.update({
        where: { item_id: item.item_id },
        data: {
          inventory_id: inventory.inventory_id,
        },
      });
    }

    return updatedInvoice;
  });

  // Audit log
  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_CONFIRMED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: branchId,
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

export async function getPurchaseInvoices(shopId, filters = {}) {
  const {
    startDate,
    endDate,
    supplierId,
    branchId,
    status,
    paymentStatus,
    limit = 50,
    offset = 0,
  } = filters;

  const where = {
    shop_id: shopId,
    ...(supplierId && { supplier_id: supplierId }),
    ...(branchId && { branch_id: branchId }),
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
            branch_name: true,
          },
        },
        creator: {
          select: {
            full_name: true,
          },
        },
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
      orderBy: { invoice_date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.purchaseInvoice.count({ where }),
  ]);

  return { invoices, total };
}

// ============================================
// GET INVOICE DETAILS
// ============================================

export async function getInvoiceDetails(invoiceId, shopId) {
  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { invoice_id: invoiceId, shop_id: shopId },
    include: {
      supplier: true,
      branch: {
        select: {
          branch_name: true,
        },
      },
      lineItems: {
        include: {
          medicine: {
            select: {
              name: true,
              manufacturer: true,
              hsn_code: true,
              pack_size: true,
            },
          },
          inventory: {
            select: {
              current_stock: true,
              available_stock: true,
            },
          },
        },
      },
      payments: true,
      creator: {
        select: {
          full_name: true,
          email: true,
        },
      },
      confirmer: {
        select: {
          full_name: true,
        },
      },
    },
  });

  if (!invoice) {
    const err = new Error("Invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  return invoice;
}

// ============================================
// UPDATE PURCHASE INVOICE (DRAFT ONLY)
// ============================================

export async function updatePurchaseInvoice(userId, shopId, branchId, invoiceId, data, auditContext) {
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
  });

  if (!invoice) {
    const err = new Error("Invoice not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (invoice.status !== "DRAFT") {
    const err = new Error("Only draft invoices can be updated");
    err.code = "NOT_DRAFT";
    throw err;
  }

  const { lineItems, ...invoiceData } = data;

  const result = await prisma.$transaction(async (tx) => {
    let updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: invoiceData,
    });

    if (lineItems && lineItems.length > 0) {
      await tx.purchaseInvoiceItem.deleteMany({
        where: { invoice_id: invoiceId },
      });

      const items = await Promise.all(
        lineItems.map((item) => {
          const itemCalc = calculateLineItemForDB(item);

          return tx.purchaseInvoiceItem.create({
            data: {
              invoice_id: invoiceId,
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

      const calculations = calculateInvoiceTotals(lineItems);
      updatedInvoice = await tx.purchaseInvoice.update({
        where: { invoice_id: invoiceId },
        data: calculations,
      });

      return { ...updatedInvoice, lineItems: items };
    }

    return updatedInvoice;
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_UPDATED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: branchId,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      updated_fields: Object.keys(data),
    },
  });

  return result;
}

// ============================================
// CANCEL PURCHASE INVOICE
// ============================================

export async function cancelPurchaseInvoice(userId, shopId, branchId, invoiceId, reason, auditContext) {
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

  if (invoice.status === "CANCELLED") {
    const err = new Error("Invoice already cancelled");
    err.code = "ALREADY_CANCELLED";
    throw err;
  }

  if (invoice.status === "CONFIRMED") {
    const err = new Error("Cannot cancel confirmed invoice. Create a purchase return instead.");
    err.code = "INVOICE_CONFIRMED";
    throw err;
  }

  const result = await prisma.purchaseInvoice.update({
    where: { invoice_id: invoiceId },
    data: {
      status: "CANCELLED",
      remarks: reason || invoice.remarks,
    },
  });

  await audit.log({
    action: audit.AuditAction.PURCHASE_INVOICE_CANCELLED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: branchId,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      supplier_name: invoice.supplier.name,
      cancellation_reason: reason,
    },
  });

  return result;
}

// ============================================
// GET PURCHASE STATISTICS
// ============================================

export async function getPurchaseStats(shopId, filters = {}) {
  const { startDate, endDate, branchId } = filters;

  const where = {
    shop_id: shopId,
    status: "CONFIRMED",
    ...(branchId && { branch_id: branchId }),
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

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateLineItemForDB(item) {
  const qty = parseFloat(item.quantity || 0);
  const rate = parseFloat(item.purchase_rate || 0);
  const schemeDisc = parseFloat(item.scheme_discount || 0);
  const tradeDisc = parseFloat(item.trade_discount || 0);

  const gross = qty * rate;

  const schemeAmt = (gross * schemeDisc) / 100;
  const afterScheme = gross - schemeAmt;
  const tradeAmt = (afterScheme * tradeDisc) / 100;

  const discountAmount = schemeAmt + tradeAmt;
  const taxableAmount = gross - discountAmount;

  const cgstPct = parseFloat(item.cgst_percent || 0);
  const sgstPct = parseFloat(item.sgst_percent || 0);
  const igstPct = parseFloat(item.igst_percent || 0);

  const cgstAmount = (taxableAmount * cgstPct) / 100;
  const sgstAmount = (taxableAmount * sgstPct) / 100;
  const igstAmount = (taxableAmount * igstPct) / 100;

  const lineTotal = taxableAmount + cgstAmount + sgstAmount + igstAmount;

  return {
    discount_amount: Number(discountAmount.toFixed(2)),
    taxable_amount: Number(taxableAmount.toFixed(2)),
    cgst_amount: Number(cgstAmount.toFixed(2)),
    sgst_amount: Number(sgstAmount.toFixed(2)),
    igst_amount: Number(igstAmount.toFixed(2)),
    line_total: Number(lineTotal.toFixed(2)),
  };
}

function calculateInvoiceTotals(lineItems) {
  let subtotal = 0;
  let discountAmount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  lineItems.forEach((item) => {
    const qty = parseFloat(item.quantity || 0);
    const rate = parseFloat(item.purchase_rate || 0);
    const schemeDisc = parseFloat(item.scheme_discount || 0);
    const tradeDisc = parseFloat(item.trade_discount || 0);

    const gross = qty * rate;
    const schemeAmt = (gross * schemeDisc) / 100;
    const afterScheme = gross - schemeAmt;
    const tradeAmt = (afterScheme * tradeDisc) / 100;

    const itemDiscount = schemeAmt + tradeAmt;
    const itemTaxable = gross - itemDiscount;

    const cgstPct = parseFloat(item.cgst_percent || 0);
    const sgstPct = parseFloat(item.sgst_percent || 0);
    const igstPct = parseFloat(item.igst_percent || 0);

    subtotal += gross;
    discountAmount += itemDiscount;
    taxableAmount += itemTaxable;
    cgstAmount += (itemTaxable * cgstPct) / 100;
    sgstAmount += (itemTaxable * sgstPct) / 100;
    igstAmount += (itemTaxable * igstPct) / 100;
  });

  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grossTotal = taxableAmount + totalTax;
  const roundOff = Math.round(grossTotal) - grossTotal;
  const netAmount = Math.round(grossTotal);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount_amount: Number(discountAmount.toFixed(2)),
    taxable_amount: Number(taxableAmount.toFixed(2)),
    cgst_amount: Number(cgstAmount.toFixed(2)),
    sgst_amount: Number(sgstAmount.toFixed(2)),
    igst_amount: Number(igstAmount.toFixed(2)),
    total_tax: Number(totalTax.toFixed(2)),
    round_off: Number(roundOff.toFixed(2)),
    net_amount: Number(netAmount.toFixed(2)),
    balance_amount: Number(netAmount.toFixed(2)),
  };
}

async function generateInvoiceNumber(shopId) {
  const lastInvoice = await prisma.purchaseInvoice.findFirst({
    where: { shop_id: shopId },
    orderBy: { created_at: "desc" },
    select: { invoice_number: true },
  });

  if (!lastInvoice) return "PUR-000001";

  const lastNumber = parseInt(lastInvoice.invoice_number.split("-")[1]);
  return `PUR-${String(lastNumber + 1).padStart(6, "0")}`;
}