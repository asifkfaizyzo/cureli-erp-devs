// backend/src/modules/purchase/purchase.service.js

import prisma from "../../config/prisma.js";
import inventoryService from "../inventory/inventory.service.js";
import * as audit from "../audit/index.js";

// ============================================
// CONSTANTS
// ============================================

const PAYMENT_BALANCE_THRESHOLD = 10; // Balance <= this amount is treated as PAID

// ============================================
// HELPER: Build Branch Filter
// ============================================

function buildBranchFilter(shopId, branchId, role, branchMode) {
  const filter = { shop_id: shopId };
  console.log("🔍 buildBranchFilter called with:", {
    shopId,
    branchId,
    role,
    branchMode,
  });

  // Super Admin in GLOBAL mode: show all invoices for shop
  if (role === "super_admin" && branchMode === "GLOBAL") {
    console.log("✅ Super Admin GLOBAL mode - no branch filter");
    return filter;
  }

  // Super Admin in BRANCH mode: filter by selected branch
  if (role === "super_admin" && branchMode === "BRANCH") {
    if (branchId) {
      filter.branch_id = branchId;
      console.log("✅ Super Admin BRANCH mode - filtering by branch:", branchId);
    } else {
      console.log("⚠️ Super Admin BRANCH mode but no branchId provided!");
    }
    return filter;
  }

  // branch_admin/staff: filter by assigned branch
  if (branchId) {
    filter.branch_id = branchId;
    console.log("✅ Non-admin user - filtering by assigned branch:", branchId);
  } else {
    console.log("⚠️ Non-admin user has no branch assigned!");
  }

  return filter;
}

// ============================================
// HELPER: Calculate Payment Status with Threshold
// ============================================

/**
 * Calculate payment status based on paid amount and net amount
 * - If balance <= threshold (default 10), treat as PAID (handles rounding)
 * - If paid amount is 0, treat as UNPAID
 * - Otherwise, PARTIALLY_PAID
 * 
 * @param {number|string} paidAmount - Amount paid
 * @param {number|string} netAmount - Total invoice amount
 * @param {number} threshold - Minimum balance to be partially paid (default: 10)
 * @returns {Object} - { status, paidAmount, balanceAmount }
 */
function calculatePaymentStatus(paidAmount, netAmount, threshold = PAYMENT_BALANCE_THRESHOLD) {
  const paid = parseFloat(paidAmount) || 0;
  const net = parseFloat(netAmount) || 0;
  const balance = net - paid;

  // If nothing paid, it's unpaid
  if (paid <= 0) {
    return {
      status: "UNPAID",
      paidAmount: 0,
      balanceAmount: net,
    };
  }

  // If balance is within threshold (e.g., ₹10), treat as fully paid
  // This handles small rounding differences
  if (balance <= threshold) {
    return {
      status: "PAID",
      paidAmount: net, // Set to full amount
      balanceAmount: 0,
    };
  }

  // Otherwise, it's partially paid
  return {
    status: "PARTIALLY_PAID",
    paidAmount: paid,
    balanceAmount: balance,
  };
}

// ============================================
// HELPER: Calculate Line Item for DB
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

// ============================================
// HELPER: Calculate Invoice Totals
// ============================================

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

// ============================================
// HELPER: Generate Invoice Number
// ============================================

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

// ============================================
// CREATE PURCHASE INVOICE
// ============================================

export async function createPurchaseInvoice(userId, shopId, branchId, data, auditContext) {
  const { supplier_id, invoice_date, lineItems, paid_amount, payment_mode, ...invoiceData } = data;

  // Validate branch selection
  if (!branchId) {
    const err = new Error("Branch selection is required to create purchase invoices. Please select a specific branch.");
    err.code = "BRANCH_REQUIRED";
    throw err;
  }

  // Get user info
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

  // Validate medicines belong to shop AND branch
  const medicineIds = lineItems.map((item) => item.medicine_id);
  const medicines = await prisma.medicine.findMany({
    where: { 
      medicine_id: { in: medicineIds }, 
      shop_id: shopId, 
      branch_id: branchId,
      is_active: true 
    },
  });

  if (medicines.length !== medicineIds.length) {
    const foundIds = medicines.map(m => m.medicine_id);
    const missingIds = medicineIds.filter(id => !foundIds.includes(id));
    
    const otherBranchMeds = await prisma.medicine.findMany({
      where: {
        medicine_id: { in: missingIds },
        shop_id: shopId,
        is_active: true,
      },
      select: { medicine_id: true, name: true, branch_id: true },
    });

    if (otherBranchMeds.length > 0) {
      const err = new Error(
        `Some medicines belong to a different branch. Cannot use medicines from other branches in this purchase.`
      );
      err.code = "BRANCH_MISMATCH";
      throw err;
    }

    const err = new Error("Some medicines are invalid or don't belong to this shop/branch");
    err.code = "INVALID_MEDICINE";
    throw err;
  }

  const invoiceNumber = await generateInvoiceNumber(shopId);
  const calculations = calculateInvoiceTotals(lineItems);

  // Calculate payment status with threshold
  const paidAmt = parseFloat(paid_amount) || 0;
  const netAmt = calculations.net_amount;
  const paymentCalc = calculatePaymentStatus(paidAmt, netAmt, PAYMENT_BALANCE_THRESHOLD);

  const result = await prisma.$transaction(async (tx) => {
    // Create invoice header
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
        // Use calculated payment values
        payment_status: paymentCalc.status,
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_mode: payment_mode || null,
        status: "DRAFT",
      },
    });

    // Create line items
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

    // Create payment record only if actually paid something
    if (paidAmt > 0) {
      await tx.purchasePayment.create({
        data: {
          invoice_id: invoice.invoice_id,
          shop_id: shopId,
          supplier_id,
          payment_date: new Date(invoice_date),
          amount: paidAmt, // Use original amount for payment record
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

  // Audit log
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
      payment_status: paymentCalc.status, // Fixed: use paymentCalc.status
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

  // Validate branch access for non-super-admin
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

  // Use invoice's branch_id for all operations
  const invoiceBranchId = invoice.branch_id;

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
        invoiceBranchId,
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

  // Transform to include _count
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
// UPDATE PURCHASE INVOICE
// ============================================

export async function updatePurchaseInvoice(userId, shopId, branchId, role, branchMode, invoiceId, data, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { 
      invoice_id: invoiceId, 
      ...baseFilter,
    },
    include: {
      lineItems: true,
      supplier: true,
    },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  const isConfirmed = invoice.status === "CONFIRMED";
  const isSuperAdmin = user.role === "super_admin";

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cancelled invoices cannot be updated");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  if (isConfirmed && !isSuperAdmin) {
    const err = new Error("Only super admin can edit confirmed invoices");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  if (invoice.status !== "DRAFT" && !isSuperAdmin) {
    const err = new Error("Only draft invoices can be updated");
    err.code = "NOT_DRAFT";
    throw err;
  }

  const { lineItems, paid_amount, payment_mode, ...invoiceData } = data;

  // Validate medicines if line items are being updated
  if (lineItems && lineItems.length > 0) {
    const medicineIds = lineItems.map((item) => item.medicine_id);
    const medicines = await prisma.medicine.findMany({
      where: { 
        medicine_id: { in: medicineIds }, 
        shop_id: shopId, 
        branch_id: invoice.branch_id,
        is_active: true 
      },
    });

    if (medicines.length !== medicineIds.length) {
      const err = new Error("Some medicines are invalid or belong to a different branch");
      err.code = "INVALID_MEDICINE";
      throw err;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    let updateData = { ...invoiceData };
    
    // Update payment fields if provided
    if (paid_amount !== undefined) {
      const paidAmt = parseFloat(paid_amount) || 0;
      const netAmt = parseFloat(invoice.net_amount);
      
      // Use threshold-based calculation
      const paymentCalc = calculatePaymentStatus(paidAmt, netAmt, PAYMENT_BALANCE_THRESHOLD);
      
      updateData = {
        ...updateData,
        payment_status: paymentCalc.status,
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_mode: payment_mode || invoice.payment_mode,
      };
    }

    let updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: updateData,
    });

    // Handle line items update
    if (lineItems && lineItems.length > 0) {
      
      // If invoice was CONFIRMED, reverse old stock first
      if (isConfirmed) {
        console.log("🔄 Super Admin editing CONFIRMED invoice - reversing stock...");
        
        for (const oldItem of invoice.lineItems) {
          if (oldItem.inventory_id) {
            const oldTotalQty = Number(oldItem.quantity) + Number(oldItem.free_quantity || 0);
            
            await inventoryService.updateStock(
              {
                inventoryId: oldItem.inventory_id,
                shopId: shopId,
                branchId: invoice.branch_id,
                medicineId: oldItem.medicine_id,
                batchNumber: oldItem.batch_number,
                movementType: "PURCHASE_RETURN",
                quantityIn: 0,
                quantityOut: oldTotalQty,
                rate: oldItem.purchase_rate,
                referenceType: "PURCHASE_INVOICE_EDIT",
                referenceId: invoice.invoice_id,
                referenceNumber: invoice.invoice_number,
                transactionDate: new Date(),
                remarks: `Stock reversal due to invoice edit by super admin`,
              },
              userId
            );
          }
        }
      }

      // Delete old line items
      await tx.purchaseInvoiceItem.deleteMany({
        where: { invoice_id: invoiceId },
      });

      // Create new line items
      const newItems = await Promise.all(
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

      // Recalculate invoice totals
      const calculations = calculateInvoiceTotals(lineItems);
      
      // Use threshold-based calculation for payment status
      const paidAmt = parseFloat(paid_amount) || parseFloat(invoice.paid_amount) || 0;
      const newNetAmt = calculations.net_amount;
      const paymentCalc = calculatePaymentStatus(paidAmt, newNetAmt, PAYMENT_BALANCE_THRESHOLD);

      updatedInvoice = await tx.purchaseInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          ...calculations,
          payment_status: paymentCalc.status,
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
        },
      });

      // If invoice was CONFIRMED, add new stock
      if (isConfirmed) {
        console.log("🔄 Adding new stock for edited CONFIRMED invoice...");
        
        for (const item of newItems) {
          const inventory = await inventoryService.getOrCreateInventory(
            shopId,
            invoice.branch_id,
            item.medicine_id,
            item.batch_number,
            item.expiry_date,
            item.mrp
          );

          const totalQuantity = Number(item.quantity) + Number(item.free_quantity || 0);

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
              remarks: `Purchase (edited by super admin)`,
            },
            userId
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
      }

      return { ...updatedInvoice, lineItems: newItems };
    }

    return updatedInvoice;
  });

  // Audit log
  await audit.log({
    action: isConfirmed 
      ? audit.AuditAction.PURCHASE_INVOICE_CONFIRMED_EDITED 
      : audit.AuditAction.PURCHASE_INVOICE_UPDATED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: isConfirmed 
      ? audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE 
      : audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      invoice_status: invoice.status,
      was_confirmed: isConfirmed,
      updated_fields: Object.keys(data),
      old_item_count: invoice.lineItems?.length || 0,
      new_item_count: lineItems?.length || invoice.lineItems?.length || 0,
      old_net_amount: invoice.net_amount,
      new_net_amount: result.net_amount,
    },
  });

  return result;
}

// ============================================
// CANCEL PURCHASE INVOICE
// ============================================

export async function cancelPurchaseInvoice(userId, shopId, branchId, role, branchMode, invoiceId, reason, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { 
      invoice_id: invoiceId, 
      ...baseFilter,
    },
    include: { lineItems: true, supplier: true },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
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
    branch_id: invoice.branch_id,
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

export async function getPurchaseStats(shopId, branchId, role, branchMode, filters = {}) {
  const { startDate, endDate } = filters;

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const where = {
    ...baseFilter,
    status: "CONFIRMED",
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
// UPDATE PAYMENT STATUS (Super Admin Only)
// ============================================

export async function updatePaymentStatus(userId, shopId, branchId, role, branchMode, invoiceId, data, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  // Only super_admin can directly change payment status
  if (user.role !== "super_admin") {
    const err = new Error("Only super admin can change payment status directly");
    err.code = "PERMISSION_DENIED";
    throw err;
  }

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { 
      invoice_id: invoiceId, 
      ...baseFilter,
    },
    include: {
      supplier: true,
    },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cannot update payment status of cancelled invoice");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  const { payment_status, paid_amount, payment_mode, remarks } = data;
  const netAmount = parseFloat(invoice.net_amount);
  
  let newPaidAmount = paid_amount !== undefined ? parseFloat(paid_amount) : parseFloat(invoice.paid_amount);
  let newBalanceAmount = netAmount - newPaidAmount;
  let newPaymentStatus = payment_status;

  // Auto-calculate based on status
  if (payment_status === "PAID") {
    newPaidAmount = netAmount;
    newBalanceAmount = 0;
  } else if (payment_status === "UNPAID") {
    newPaidAmount = 0;
    newBalanceAmount = netAmount;
  } else if (payment_status === "PARTIALLY_PAID") {
    // Validate for PARTIALLY_PAID
    if (newPaidAmount <= 0) {
      const err = new Error("Partial payment requires a paid amount greater than 0");
      err.code = "INVALID_AMOUNT";
      throw err;
    }
    
    // If balance is within threshold, auto-upgrade to PAID
    if (newBalanceAmount <= PAYMENT_BALANCE_THRESHOLD) {
      newPaymentStatus = "PAID";
      newPaidAmount = netAmount;
      newBalanceAmount = 0;
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Update invoice payment status
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        payment_status: newPaymentStatus,
        paid_amount: newPaidAmount,
        balance_amount: newBalanceAmount,
        payment_mode: payment_mode || invoice.payment_mode,
        remarks: remarks || invoice.remarks,
      },
    });

    // If marking as PAID and no previous payment record exists, create one
    if (payment_status === "PAID" && parseFloat(invoice.paid_amount) < netAmount) {
      const paymentDiff = netAmount - parseFloat(invoice.paid_amount);
      
      await tx.purchasePayment.create({
        data: {
          invoice_id: invoiceId,
          shop_id: shopId,
          supplier_id: invoice.supplier_id,
          payment_date: new Date(),
          amount: paymentDiff,
          payment_mode: payment_mode || "CASH",
          status: "COMPLETED",
          created_by: userId,
          remarks: remarks || "Payment status updated by Super Admin",
        },
      });
    }

    return updatedInvoice;
  });

  // Audit log
  await audit.log({
    action: audit.AuditAction.PURCHASE_PAYMENT_STATUS_UPDATED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
    metadata: {
      invoice_number: invoice.invoice_number,
      supplier_name: invoice.supplier.name,
      old_payment_status: invoice.payment_status,
      new_payment_status: newPaymentStatus,
      old_paid_amount: invoice.paid_amount,
      new_paid_amount: newPaidAmount,
      net_amount: netAmount,
      threshold_applied: newPaymentStatus === "PAID" && payment_status === "PARTIALLY_PAID",
    },
  });

  return result;
}

// ============================================
// RECORD PAYMENT
// ============================================

export async function recordPayment(userId, shopId, branchId, role, branchMode, invoiceId, data, auditContext) {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { role: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "NOT_FOUND";
    throw err;
  }

  const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

  const invoice = await prisma.purchaseInvoice.findFirst({
    where: { 
      invoice_id: invoiceId, 
      ...baseFilter,
    },
    include: {
      supplier: true,
    },
  });

  if (!invoice) {
    const err = new Error("Invoice not found or you don't have access");
    err.code = "NOT_FOUND";
    throw err;
  }

  if (invoice.status === "CANCELLED") {
    const err = new Error("Cannot record payment for cancelled invoice");
    err.code = "INVOICE_CANCELLED";
    throw err;
  }

  if (invoice.payment_status === "PAID") {
    const err = new Error("Invoice is already fully paid");
    err.code = "ALREADY_PAID";
    throw err;
  }

  const { amount, payment_mode, payment_date, reference_number, bank_name, remarks } = data;
  const paymentAmount = parseFloat(amount);
  const currentPaid = parseFloat(invoice.paid_amount);
  const netAmount = parseFloat(invoice.net_amount);
  const newPaidAmount = currentPaid + paymentAmount;

  // Check for overpayment
  if (newPaidAmount > netAmount) {
    const err = new Error(`Payment of ₹${paymentAmount} would exceed balance of ₹${invoice.balance_amount}`);
    err.code = "OVERPAYMENT";
    throw err;
  }

  // Use threshold-based calculation
  const paymentCalc = calculatePaymentStatus(newPaidAmount, netAmount, PAYMENT_BALANCE_THRESHOLD);

  const result = await prisma.$transaction(async (tx) => {
    // Create payment record with original amount
    const payment = await tx.purchasePayment.create({
      data: {
        invoice_id: invoiceId,
        shop_id: shopId,
        supplier_id: invoice.supplier_id,
        payment_date: payment_date ? new Date(payment_date) : new Date(),
        amount: paymentAmount,
        payment_mode,
        reference_number: reference_number || null,
        bank_name: bank_name || null,
        status: "COMPLETED",
        created_by: userId,
        remarks: remarks || null,
      },
    });

    // Update invoice with calculated status
    const updatedInvoice = await tx.purchaseInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        payment_status: paymentCalc.status,
        paid_amount: paymentCalc.paidAmount,
        balance_amount: paymentCalc.balanceAmount,
        payment_mode: payment_mode,
      },
    });

    return { payment, invoice: updatedInvoice };
  });

  // Audit log
  await audit.log({
    action: audit.AuditAction.PURCHASE_PAYMENT_RECORDED,
    entity_type: audit.EntityType.PURCHASE_INVOICE,
    entity_id: invoiceId,
    shop_id: shopId,
    branch_id: invoice.branch_id,
    actor_type: audit.ActorType.ERP_USER,
    actor_id: userId,
    actor_role: user.role,
    ...auditContext,
    reason_code: audit.AuditReasonCode.USER_REQUEST,
    metadata: {
      invoice_number: invoice.invoice_number,
      payment_id: result.payment.payment_id,
      payment_amount: paymentAmount,
      payment_mode,
      old_payment_status: invoice.payment_status,
      new_payment_status: paymentCalc.status,
      total_paid: paymentCalc.paidAmount,
      balance_remaining: paymentCalc.balanceAmount,
      threshold_applied: paymentCalc.status === "PAID" && (netAmount - newPaidAmount) > 0,
    },
  });

  return result;
}