// backend/src/modules/sales/sales.service.js

import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js";
import {
  PAYMENT_BALANCE_THRESHOLD,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  PAYMENT_MODES,
  buildBranchFilter,
  calculateLineItem,
  calculateInvoiceTotals,
  calculatePaymentStatus,
  generateSalesInvoiceNumber,
  checkStockAvailability,
  reserveStock,
  releaseReservedStock,
  confirmStockDeduction,
} from "./sales.helpers.js";
import customerService from "../customers/customer.service.js";

// ============================================
// CUSTOM ERROR
// ============================================

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "SALES_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ============================================
// SALES SERVICE CLASS
// ============================================

class SalesService {
  // ============================================
  // GET AVAILABLE BATCHES FOR A MEDICINE
  // Returns batches with stock for dropdown selection
  // ============================================

  async getAvailableBatches(shopId, branchId, medicineId, options = {}) {
    const { includeLowStock = false, includeExpiring = true } = options;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where = {
      shop_id: shopId,
      branch_id: branchId,
      medicine_id: medicineId,
      is_active: true,
      is_expired: false,
      available_stock: { gt: 0 },
      expiry_date: { gte: today },
    };

    const batches = await prisma.inventory.findMany({
      where,
      select: {
        inventory_id: true,
        batch_number: true,
        expiry_date: true,
        current_stock: true,
        reserved_stock: true,
        available_stock: true,
        mrp: true,
        selling_rate: true,
        rack_no: true,
        medicine: {
          select: {
            medicine_id: true,
            name: true,
            manufacturer: true,
            pack_size: true,
            gst_percentage: true,
            cgst_percentage: true,
            sgst_percentage: true,
          },
        },
      },
      orderBy: [
        { expiry_date: "asc" },
        { batch_number: "asc" },
      ],
    });

    const enrichedBatches = batches.map((batch) => {
      const expiryDate = new Date(batch.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate - today) / (1000 * 60 * 60 * 24)
      );

      let status = "available";
      if (daysUntilExpiry <= 30) status = "expiring_soon";
      if (parseFloat(batch.available_stock) <= 10) status = "low_stock";

      return {
        ...batch,
        days_until_expiry: daysUntilExpiry,
        status,
        display_label: `${batch.batch_number} | Exp: ${expiryDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        })} | Stock: ${batch.available_stock} | MRP: ₹${batch.mrp}`,
      };
    });

    let filteredBatches = enrichedBatches;

    if (!includeLowStock) {
      filteredBatches = filteredBatches.filter(
        (b) => parseFloat(b.available_stock) > 5
      );
    }

    if (!includeExpiring) {
      filteredBatches = filteredBatches.filter(
        (b) => b.days_until_expiry > 30
      );
    }

    return filteredBatches;
  }

  // ============================================
  // CREATE DRAFT SALE
  // Reserves stock immediately
  // ============================================

  async createDraftSale(userId, shopId, branchId, data, auditContext) {
    if (!branchId) {
      throw new ApiError(
        "Branch selection is required for sales",
        400,
        "BRANCH_REQUIRED"
      );
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    let customer = null;
    let customerDiscountPercent = 0;

    if (data.customer_id) {
      customer = await prisma.customer.findFirst({
        where: {
          customer_id: data.customer_id,
          shop_id: shopId,
          is_active: true,
        },
      });

      if (!customer) {
        throw new ApiError("Customer not found or inactive", 404, "CUSTOMER_NOT_FOUND");
      }

      customerDiscountPercent = parseFloat(customer.discount_percent) || 0;
    }

    const stockCheck = await checkStockAvailability(shopId, branchId, data.lineItems);
    if (!stockCheck.isValid) {
      throw new ApiError(
        `Stock validation failed: ${stockCheck.errors.map((e) => e.error).join("; ")}`,
        400,
        "INSUFFICIENT_STOCK"
      );
    }

    const medicineIds = [...new Set(data.lineItems.map((item) => item.medicine_id))];
    const medicines = await prisma.medicine.findMany({
      where: { medicine_id: { in: medicineIds } },
      select: {
        medicine_id: true,
        name: true,
        cgst_percentage: true,
        sgst_percentage: true,
      },
    });

    const medicineMap = new Map(medicines.map((m) => [m.medicine_id, m]));

    const enrichedLineItems = data.lineItems.map((item) => {
      const medicine = medicineMap.get(item.medicine_id);
      return {
        ...item,
        cgst_percent: item.cgst_percent ?? parseFloat(medicine?.cgst_percentage || 0),
        sgst_percent: item.sgst_percent ?? parseFloat(medicine?.sgst_percentage || 0),
      };
    });

    const calculations = calculateInvoiceTotals(
      enrichedLineItems,
      customerDiscountPercent,
      parseFloat(data.bill_discount_percent) || 0
    );

    const invoiceNumber = await generateSalesInvoiceNumber(shopId, branchId);

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.create({
        data: {
          invoice_number: invoiceNumber,
          shop_id: shopId,
          branch_id: branchId,
          customer_id: data.customer_id || null,
          walkin_name: data.walkin_name || null,
          walkin_phone: data.walkin_phone || null,
          invoice_date: new Date(data.invoice_date),
          due_date: data.due_date ? new Date(data.due_date) : null,
          created_by: userId,

          subtotal: calculations.subtotal,
          item_discount_amount: calculations.item_discount_amount,
          customer_discount_percent: calculations.customer_discount_percent,
          customer_discount_amount: calculations.customer_discount_amount,
          bill_discount_percent: calculations.bill_discount_percent,
          bill_discount_amount: calculations.bill_discount_amount,
          total_discount: calculations.total_discount,
          taxable_amount: calculations.taxable_amount,
          cgst_amount: calculations.cgst_amount,
          sgst_amount: calculations.sgst_amount,
          total_tax: calculations.total_tax,
          round_off: calculations.round_off,
          net_amount: calculations.net_amount,
          balance_amount: calculations.net_amount,

          status: INVOICE_STATUS.DRAFT,
          payment_status: PAYMENT_STATUS.UNPAID,

          prescription_number: data.prescription_number || null,
          doctor_name: data.doctor_name || null,

          remarks: data.remarks || null,
        },
      });

      const lineItems = await Promise.all(
        enrichedLineItems.map(async (item) => {
          const itemCalc = calculateLineItem(item);

          const inventory = await tx.inventory.findUnique({
            where: { inventory_id: item.inventory_id },
            select: {
              batch_number: true,
              expiry_date: true,
              mrp: true,
              last_purchase_rate: true,
            },
          });

          return tx.salesInvoiceItem.create({
            data: {
              invoice_id: invoice.invoice_id,
              medicine_id: item.medicine_id,
              inventory_id: item.inventory_id,
              batch_number: inventory?.batch_number || item.batch_number,
              expiry_date: inventory?.expiry_date || new Date(item.expiry_date),
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure || "UNIT",
              mrp: item.mrp,
              purchase_rate: inventory?.last_purchase_rate || item.purchase_rate || null,
              discount_percent: item.discount_percent || 0,
              discount_amount: itemCalc.discount_amount,
              taxable_amount: itemCalc.taxable_amount,
              cgst_percent: item.cgst_percent,
              cgst_amount: itemCalc.cgst_amount,
              sgst_percent: item.sgst_percent,
              sgst_amount: itemCalc.sgst_amount,
              line_total: itemCalc.line_total,
            },
          });
        })
      );

      await reserveStock(tx, shopId, branchId, enrichedLineItems, invoice.invoice_id);

      return { ...invoice, lineItems };
    });

    await audit.log({
      action: audit.AuditAction.SALES_INVOICE_CREATED,
      entity_type: audit.EntityType.SALES_INVOICE,
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
        customer_id: data.customer_id,
        customer_name: customer?.name || data.walkin_name || "Walk-in",
        item_count: data.lineItems.length,
        net_amount: calculations.net_amount,
        status: INVOICE_STATUS.DRAFT,
      },
    });

    return result;
  }

  // ============================================
  // ADD ITEMS TO EXISTING DRAFT
  // ============================================

  async addItemsToDraft(userId, shopId, branchId, invoiceId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: { in: [INVOICE_STATUS.DRAFT, INVOICE_STATUS.PARKED] },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError(
        "Invoice not found or not in draft/parked status",
        404,
        "NOT_FOUND"
      );
    }

    const stockCheck = await checkStockAvailability(shopId, branchId, data.lineItems);
    if (!stockCheck.isValid) {
      throw new ApiError(
        `Stock validation failed: ${stockCheck.errors.map((e) => e.error).join("; ")}`,
        400,
        "INSUFFICIENT_STOCK"
      );
    }

    const medicineIds = [...new Set(data.lineItems.map((item) => item.medicine_id))];
    const medicines = await prisma.medicine.findMany({
      where: { medicine_id: { in: medicineIds } },
      select: {
        medicine_id: true,
        cgst_percentage: true,
        sgst_percentage: true,
      },
    });

    const medicineMap = new Map(medicines.map((m) => [m.medicine_id, m]));

    const enrichedLineItems = data.lineItems.map((item) => {
      const medicine = medicineMap.get(item.medicine_id);
      return {
        ...item,
        cgst_percent: item.cgst_percent ?? parseFloat(medicine?.cgst_percentage || 0),
        sgst_percent: item.sgst_percent ?? parseFloat(medicine?.sgst_percentage || 0),
      };
    });

    const result = await prisma.$transaction(async (tx) => {
      const newItems = await Promise.all(
        enrichedLineItems.map(async (item) => {
          const itemCalc = calculateLineItem(item);

          const inventory = await tx.inventory.findUnique({
            where: { inventory_id: item.inventory_id },
            select: {
              batch_number: true,
              expiry_date: true,
              mrp: true,
              last_purchase_rate: true,
            },
          });

          return tx.salesInvoiceItem.create({
            data: {
              invoice_id: invoiceId,
              medicine_id: item.medicine_id,
              inventory_id: item.inventory_id,
              batch_number: inventory?.batch_number || item.batch_number,
              expiry_date: inventory?.expiry_date || new Date(item.expiry_date),
              quantity: item.quantity,
              unit_of_measure: item.unit_of_measure || "UNIT",
              mrp: item.mrp,
              purchase_rate: inventory?.last_purchase_rate || null,
              discount_percent: item.discount_percent || 0,
              discount_amount: itemCalc.discount_amount,
              taxable_amount: itemCalc.taxable_amount,
              cgst_percent: item.cgst_percent,
              cgst_amount: itemCalc.cgst_amount,
              sgst_percent: item.sgst_percent,
              sgst_amount: itemCalc.sgst_amount,
              line_total: itemCalc.line_total,
            },
          });
        })
      );

      await reserveStock(tx, shopId, branchId, enrichedLineItems, invoiceId);

      const allLineItems = await tx.salesInvoiceItem.findMany({
        where: { invoice_id: invoiceId },
      });

      const customerDiscountPercent = parseFloat(invoice.customer?.discount_percent || 0);
      const billDiscountPercent = parseFloat(invoice.bill_discount_percent || 0);

      const allItemsForCalc = allLineItems.map((item) => ({
        quantity: parseFloat(item.quantity),
        mrp: parseFloat(item.mrp),
        discount_percent: parseFloat(item.discount_percent),
        cgst_percent: parseFloat(item.cgst_percent),
        sgst_percent: parseFloat(item.sgst_percent),
      }));

      const calculations = calculateInvoiceTotals(
        allItemsForCalc,
        customerDiscountPercent,
        billDiscountPercent
      );

      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          subtotal: calculations.subtotal,
          item_discount_amount: calculations.item_discount_amount,
          customer_discount_amount: calculations.customer_discount_amount,
          bill_discount_amount: calculations.bill_discount_amount,
          total_discount: calculations.total_discount,
          taxable_amount: calculations.taxable_amount,
          cgst_amount: calculations.cgst_amount,
          sgst_amount: calculations.sgst_amount,
          total_tax: calculations.total_tax,
          round_off: calculations.round_off,
          net_amount: calculations.net_amount,
          balance_amount: calculations.net_amount - parseFloat(invoice.paid_amount || 0),
        },
      });

      return { ...updatedInvoice, lineItems: allLineItems, newItems };
    });

    return result;
  }

  // ============================================
  // REMOVE ITEM FROM DRAFT
  // ============================================

  async removeItemFromDraft(userId, shopId, branchId, invoiceId, itemId, auditContext) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: { in: [INVOICE_STATUS.DRAFT, INVOICE_STATUS.PARKED] },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError(
        "Invoice not found or not in draft/parked status",
        404,
        "NOT_FOUND"
      );
    }

    const itemToRemove = invoice.lineItems.find((item) => item.item_id === itemId);
    if (!itemToRemove) {
      throw new ApiError("Item not found in this invoice", 404, "ITEM_NOT_FOUND");
    }

    if (invoice.lineItems.length === 1) {
      throw new ApiError(
        "Cannot remove the last item. Cancel the invoice instead.",
        400,
        "LAST_ITEM"
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await releaseReservedStock(tx, [itemToRemove]);

      await tx.salesInvoiceItem.delete({
        where: { item_id: itemId },
      });

      const remainingItems = await tx.salesInvoiceItem.findMany({
        where: { invoice_id: invoiceId },
      });

      const customerDiscountPercent = parseFloat(invoice.customer?.discount_percent || 0);
      const billDiscountPercent = parseFloat(invoice.bill_discount_percent || 0);

      const itemsForCalc = remainingItems.map((item) => ({
        quantity: parseFloat(item.quantity),
        mrp: parseFloat(item.mrp),
        discount_percent: parseFloat(item.discount_percent),
        cgst_percent: parseFloat(item.cgst_percent),
        sgst_percent: parseFloat(item.sgst_percent),
      }));

      const calculations = calculateInvoiceTotals(
        itemsForCalc,
        customerDiscountPercent,
        billDiscountPercent
      );

      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          subtotal: calculations.subtotal,
          item_discount_amount: calculations.item_discount_amount,
          customer_discount_amount: calculations.customer_discount_amount,
          bill_discount_amount: calculations.bill_discount_amount,
          total_discount: calculations.total_discount,
          taxable_amount: calculations.taxable_amount,
          cgst_amount: calculations.cgst_amount,
          sgst_amount: calculations.sgst_amount,
          total_tax: calculations.total_tax,
          round_off: calculations.round_off,
          net_amount: calculations.net_amount,
          balance_amount: calculations.net_amount - parseFloat(invoice.paid_amount || 0),
        },
      });

      return { ...updatedInvoice, lineItems: remainingItems };
    });

    return result;
  }

  // ============================================
  // PARK INVOICE (Save for later)
  // ============================================

  async parkInvoice(userId, shopId, branchId, invoiceId, data, auditContext) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.DRAFT,
      },
    });

    if (!invoice) {
      throw new ApiError("Draft invoice not found", 404, "NOT_FOUND");
    }

    const updatedInvoice = await prisma.salesInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: INVOICE_STATUS.PARKED,
        remarks: data?.remarks || invoice.remarks,
      },
    });

    return updatedInvoice;
  }

  // ============================================
  // RESUME PARKED INVOICE
  // ============================================

  async resumeParkedInvoice(userId, shopId, branchId, invoiceId) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.PARKED,
      },
      include: {
        lineItems: {
          include: {
            medicine: {
              select: {
                name: true,
                manufacturer: true,
              },
            },
            inventory: {
              select: {
                available_stock: true,
                batch_number: true,
                expiry_date: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError("Parked invoice not found", 404, "NOT_FOUND");
    }

    const updatedInvoice = await prisma.salesInvoice.update({
      where: { invoice_id: invoiceId },
      data: {
        status: INVOICE_STATUS.DRAFT,
      },
      include: {
        lineItems: {
          include: {
            medicine: {
              select: {
                medicine_id: true,
                name: true,
                manufacturer: true,
                pack_size: true,
              },
            },
            inventory: {
              select: {
                available_stock: true,
                reserved_stock: true,
                batch_number: true,
                expiry_date: true,
                mrp: true,
              },
            },
          },
        },
        customer: true,
      },
    });

    return updatedInvoice;
  }

  // ============================================
  // GET PARKED INVOICES
  // ============================================

  async getParkedInvoices(shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const invoices = await prisma.salesInvoice.findMany({
      where: {
        ...baseFilter,
        status: INVOICE_STATUS.PARKED,
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        creator: {
          select: {
            full_name: true,
          },
        },
        _count: {
          select: { lineItems: true },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    return invoices;
  }

  // ============================================
  // CONFIRM SALE
  // Deducts stock, records payment
  // ============================================

  async confirmSale(userId, shopId, branchId, invoiceId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: { in: [INVOICE_STATUS.DRAFT, INVOICE_STATUS.PARKED] },
      },
      include: {
        lineItems: true,
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError(
        "Invoice not found or already confirmed/cancelled",
        404,
        "NOT_FOUND"
      );
    }

    if (invoice.lineItems.length === 0) {
      throw new ApiError("Cannot confirm invoice with no items", 400, "NO_ITEMS");
    }

    const payments = data?.payments || [];
    let totalPaid = 0;
    let creditAmount = 0;

    for (const payment of payments) {
      if (payment.payment_mode === PAYMENT_MODES.CREDIT) {
        creditAmount += parseFloat(payment.amount);
      } else {
        totalPaid += parseFloat(payment.amount);
      }
    }

    const netAmount = parseFloat(invoice.net_amount);
    const totalPayment = totalPaid + creditAmount;

    if (creditAmount > 0 && invoice.customer_id) {
      const creditCheck = await customerService.checkCreditAvailability(
        invoice.customer_id,
        creditAmount
      );

      if (!creditCheck.allowed) {
        throw new ApiError(creditCheck.reason, 400, "CREDIT_LIMIT_EXCEEDED");
      }
    }

    if (creditAmount > 0 && !invoice.customer_id) {
      throw new ApiError(
        "Credit sales require a registered customer",
        400,
        "CREDIT_REQUIRES_CUSTOMER"
      );
    }

    if (totalPayment > netAmount + PAYMENT_BALANCE_THRESHOLD) {
      throw new ApiError(
        `Total payment (₹${totalPayment}) exceeds invoice amount (₹${netAmount})`,
        400,
        "OVERPAYMENT"
      );
    }

    const paymentCalc = calculatePaymentStatus(totalPayment, netAmount);

    const result = await prisma.$transaction(async (tx) => {
      await confirmStockDeduction(tx, invoice, invoice.lineItems, userId);

      const confirmedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          status: INVOICE_STATUS.CONFIRMED,
          confirmed_by: userId,
          confirmed_at: new Date(),
          payment_status: paymentCalc.status,
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
          credit_amount: creditAmount,
          is_credit_sale: creditAmount > 0,
        },
      });

      for (const payment of payments) {
        if (parseFloat(payment.amount) <= 0) continue;

        await tx.salesPayment.create({
          data: {
            invoice_id: invoiceId,
            shop_id: shopId,
            branch_id: branchId,
            customer_id: invoice.customer_id,
            payment_date: new Date(),
            amount: payment.amount,
            payment_mode: payment.payment_mode,
            reference_number: payment.reference_number || null,
            status: "COMPLETED",
            created_by: userId,
          },
        });
      }

      if (creditAmount > 0 && invoice.customer_id) {
        const customer = await tx.customer.findUnique({
          where: { customer_id: invoice.customer_id },
        });

        const currentBalance = parseFloat(customer?.outstanding_balance || 0);
        const newBalance = currentBalance + creditAmount;

        await tx.customerLedger.create({
          data: {
            customer_id: invoice.customer_id,
            shop_id: shopId,
            branch_id: branchId,
            transaction_type: "SALE",
            reference_type: "SALES_INVOICE",
            reference_id: invoiceId,
            reference_number: invoice.invoice_number,
            debit_amount: creditAmount,
            credit_amount: 0,
            balance_after: newBalance,
            transaction_date: new Date(),
            remarks: `Credit sale: ${invoice.invoice_number}`,
            created_by: userId,
          },
        });

        await tx.customer.update({
          where: { customer_id: invoice.customer_id },
          data: {
            outstanding_balance: newBalance,
          },
        });
      }

      return confirmedInvoice;
    });

    await audit.log({
      action: audit.AuditAction.SALES_INVOICE_CONFIRMED,
      entity_type: audit.EntityType.SALES_INVOICE,
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
        customer_name: invoice.customer?.name || invoice.walkin_name || "Walk-in",
        net_amount: netAmount,
        paid_amount: totalPaid,
        credit_amount: creditAmount,
        payment_status: paymentCalc.status,
        item_count: invoice.lineItems.length,
      },
    });

    return result;
  }

  // ============================================
  // CANCEL INVOICE
  // ============================================

  async cancelInvoice(userId, shopId, branchId, invoiceId, reason, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
      },
      include: {
        lineItems: true,
      },
    });

    if (!invoice) {
      throw new ApiError("Invoice not found", 404, "NOT_FOUND");
    }

    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      throw new ApiError("Invoice already cancelled", 400, "ALREADY_CANCELLED");
    }

    if (invoice.status === INVOICE_STATUS.CONFIRMED) {
      throw new ApiError(
        "Cannot cancel confirmed invoice. Use Sales Return instead.",
        400,
        "CANNOT_CANCEL_CONFIRMED"
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      await releaseReservedStock(tx, invoice.lineItems);

      const cancelledInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          status: INVOICE_STATUS.CANCELLED,
          cancelled_at: new Date(),
          cancelled_by: userId,
          cancellation_reason: reason,
        },
      });

      return cancelledInvoice;
    });

    await audit.log({
      action: audit.AuditAction.SALES_INVOICE_CANCELLED,
      entity_type: audit.EntityType.SALES_INVOICE,
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
        cancellation_reason: reason,
        was_status: invoice.status,
      },
    });

    return result;
  }

  // ============================================
  // RECORD PAYMENT
  // ============================================

  async recordPayment(userId, shopId, branchId, invoiceId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        status: INVOICE_STATUS.CONFIRMED,
      },
      include: {
        customer: true,
      },
    });

    if (!invoice) {
      throw new ApiError("Confirmed invoice not found", 404, "NOT_FOUND");
    }

    if (invoice.payment_status === PAYMENT_STATUS.PAID) {
      throw new ApiError("Invoice already fully paid", 400, "ALREADY_PAID");
    }

    const paymentAmount = parseFloat(data.amount);
    const currentPaid = parseFloat(invoice.paid_amount);
    const netAmount = parseFloat(invoice.net_amount);
    const newPaidAmount = currentPaid + paymentAmount;

    if (newPaidAmount > netAmount + PAYMENT_BALANCE_THRESHOLD) {
      throw new ApiError(
        `Payment of ₹${paymentAmount} would exceed balance of ₹${invoice.balance_amount}`,
        400,
        "OVERPAYMENT"
      );
    }

    const paymentCalc = calculatePaymentStatus(newPaidAmount, netAmount);

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.salesPayment.create({
        data: {
          invoice_id: invoiceId,
          shop_id: shopId,
          branch_id: branchId,
          customer_id: invoice.customer_id,
          payment_date: data.payment_date ? new Date(data.payment_date) : new Date(),
          amount: paymentAmount,
          payment_mode: data.payment_mode,
          reference_number: data.reference_number || null,
          status: "COMPLETED",
          remarks: data.remarks || null,
          created_by: userId,
        },
      });

      const updatedInvoice = await tx.salesInvoice.update({
        where: { invoice_id: invoiceId },
        data: {
          payment_status: paymentCalc.status,
          paid_amount: paymentCalc.paidAmount,
          balance_amount: paymentCalc.balanceAmount,
          credit_amount: Math.max(
            0,
            parseFloat(invoice.credit_amount) - paymentAmount
          ),
        },
      });

      if (invoice.customer_id && invoice.is_credit_sale) {
        const customer = await tx.customer.findUnique({
          where: { customer_id: invoice.customer_id },
        });

        const currentBalance = parseFloat(customer?.outstanding_balance || 0);
        const newBalance = Math.max(0, currentBalance - paymentAmount);

        await tx.customerLedger.create({
          data: {
            customer_id: invoice.customer_id,
            shop_id: shopId,
            branch_id: branchId,
            transaction_type: "PAYMENT",
            reference_type: "SALES_PAYMENT",
            reference_id: payment.payment_id,
            reference_number: `PMT-${payment.payment_id.slice(-8)}`,
            debit_amount: 0,
            credit_amount: paymentAmount,
            balance_after: newBalance,
            transaction_date: new Date(),
            remarks: `Payment received for ${invoice.invoice_number}`,
            created_by: userId,
          },
        });

        await tx.customer.update({
          where: { customer_id: invoice.customer_id },
          data: {
            outstanding_balance: newBalance,
          },
        });
      }

      return { payment, invoice: updatedInvoice };
    });

    return result;
  }

  // ============================================
  // GET SALES INVOICES
  // ============================================

  async getSalesInvoices(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      status,
      paymentStatus,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_return: false,
      ...(customerId && { customer_id: customerId }),
      ...(status && { status }),
      ...(paymentStatus && { payment_status: paymentStatus }),
      ...(startDate &&
        endDate && {
          invoice_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { walkin_name: { contains: search, mode: "insensitive" } },
          { walkin_phone: { contains: search, mode: "insensitive" } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { customer: { phone: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        include: {
          customer: {
            select: {
              customer_id: true,
              name: true,
              phone: true,
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
          _count: {
            select: { lineItems: true, payments: true },
          },
        },
        orderBy: { invoice_date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    return { invoices, total };
  }

  // ============================================
  // GET INVOICE DETAILS
  // ============================================

  async getInvoiceDetails(invoiceId, shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        ...baseFilter,
      },
      include: {
        customer: true,
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
            address_line_1: true,
            city: true,
            state: true,
            pincode: true,
            contact_number: true,
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
                pack_size: true,
                hsn_code: true,
                schedule: true,
              },
            },
            inventory: {
              select: {
                inventory_id: true,
                current_stock: true,
                available_stock: true,
                rack_no: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
        payments: {
          orderBy: { payment_date: "desc" },
          include: {
            creator: {
              select: { full_name: true },
            },
          },
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        confirmer: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        canceller: {
          select: {
            user_id: true,
            full_name: true,
          },
        },
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
          },
        },
        returnInvoices: {
          select: {
            invoice_id: true,
            invoice_number: true,
            net_amount: true,
            status: true,
            return_reason: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new ApiError("Invoice not found", 404, "NOT_FOUND");
    }

    return invoice;
  }

  // ============================================
  // GET SALES STATISTICS
  // ============================================

  async getSalesStats(shopId, branchId, role, branchMode, filters = {}) {
    const { startDate, endDate } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      status: INVOICE_STATUS.CONFIRMED,
      is_return: false,
      ...(startDate &&
        endDate && {
          invoice_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [
      totalInvoices,
      totalSales,
      totalReceived,
      totalOutstanding,
      todaySales,
    ] = await Promise.all([
      prisma.salesInvoice.count({ where }),
      prisma.salesInvoice.aggregate({
        where,
        _sum: { net_amount: true },
      }),
      prisma.salesInvoice.aggregate({
        where,
        _sum: { paid_amount: true },
      }),
      prisma.salesInvoice.aggregate({
        where: {
          ...where,
          payment_status: { not: PAYMENT_STATUS.PAID },
        },
        _sum: { balance_amount: true },
      }),
      prisma.salesInvoice.aggregate({
        where: {
          ...baseFilter,
          status: INVOICE_STATUS.CONFIRMED,
          is_return: false,
          invoice_date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        _sum: { net_amount: true },
        _count: true,
      }),
    ]);

    return {
      totalInvoices,
      totalSalesAmount: totalSales._sum.net_amount || 0,
      totalReceivedAmount: totalReceived._sum.paid_amount || 0,
      totalOutstandingAmount: totalOutstanding._sum.balance_amount || 0,
      todaySalesAmount: todaySales._sum.net_amount || 0,
      todayInvoiceCount: todaySales._count || 0,
    };
  }
}

export default new SalesService();