// backend/src/modules/sales/sales-return.service.js

import prisma from "../../config/prisma.js";
import * as audit from "../audit/index.js";
import {
  PAYMENT_BALANCE_THRESHOLD,
  INVOICE_STATUS,
  PAYMENT_STATUS,
  buildBranchFilter,
  calculateLineItem,
  calculateInvoiceTotals,
  calculatePaymentStatus,
  generateSalesReturnNumber,
} from "./sales.helpers.js";

// ============================================
// CUSTOM ERROR
// ============================================

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "SALES_RETURN_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// ============================================
// SALES RETURN SERVICE
// ============================================

class SalesReturnService {
  // ============================================
  // CREATE SALES RETURN
  // ============================================

  async createSalesReturn(userId, shopId, branchId, data, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true, full_name: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    if (!["super_admin", "branch_admin"].includes(user.role)) {
      throw new ApiError(
        "Only Branch Admin or Super Admin can process sales returns",
        403,
        "PERMISSION_DENIED"
      );
    }

    if (!branchId) {
      throw new ApiError(
        "Branch selection is required for sales returns",
        400,
        "BRANCH_REQUIRED"
      );
    }

    const parentInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: data.parent_invoice_id,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.CONFIRMED,
        is_return: false,
      },
      include: {
        lineItems: {
          include: {
            medicine: {
              select: {
                medicine_id: true,
                name: true,
                manufacturer: true,
                cgst_percentage: true,
                sgst_percentage: true,
              },
            },
            inventory: {
              select: {
                inventory_id: true,
                batch_number: true,
                expiry_date: true,
                current_stock: true,
                available_stock: true,
                mrp: true,
              },
            },
          },
        },
        customer: true,
        returnInvoices: {
          where: {
            status: { not: INVOICE_STATUS.CANCELLED },
          },
          select: {
            lineItems: {
              select: {
                medicine_id: true,
                inventory_id: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!parentInvoice) {
      throw new ApiError(
        "Parent invoice not found, not confirmed, or belongs to different branch",
        404,
        "PARENT_NOT_FOUND"
      );
    }

    const returnedQuantityMap = new Map();
    for (const returnInv of parentInvoice.returnInvoices) {
      for (const item of returnInv.lineItems) {
        const key = `${item.medicine_id}_${item.inventory_id}`;
        const current = returnedQuantityMap.get(key) || 0;
        returnedQuantityMap.set(key, current + parseFloat(item.quantity));
      }
    }

    const validatedItems = [];
    for (const returnItem of data.lineItems) {
      const originalItem = parentInvoice.lineItems.find(
        (item) => item.item_id === returnItem.item_id
      );

      if (!originalItem) {
        throw new ApiError(
          `Item ${returnItem.item_id} not found in original sale`,
          400,
          "ITEM_NOT_FOUND"
        );
      }

      const originalQty = parseFloat(originalItem.quantity);
      const returnQty = parseFloat(returnItem.quantity);
      const key = `${originalItem.medicine_id}_${originalItem.inventory_id}`;
      const alreadyReturned = returnedQuantityMap.get(key) || 0;
      const remainingReturnable = originalQty - alreadyReturned;

      if (returnQty <= 0) {
        throw new ApiError(
          `Return quantity must be greater than 0 for ${originalItem.medicine.name}`,
          400,
          "INVALID_QUANTITY"
        );
      }

      if (returnQty > remainingReturnable) {
        throw new ApiError(
          `Cannot return ${returnQty} units of ${originalItem.medicine.name}. ` +
          `Original: ${originalQty}, Already returned: ${alreadyReturned}, Remaining: ${remainingReturnable}`,
          400,
          "EXCEEDS_RETURNABLE"
        );
      }

      validatedItems.push({
        originalItem,
        returnQty,
        medicine: originalItem.medicine,
        inventory: originalItem.inventory,
      });
    }

    const returnLineItems = validatedItems.map((item) => ({
      quantity: item.returnQty,
      mrp: parseFloat(item.originalItem.mrp),
      discount_percent: parseFloat(item.originalItem.discount_percent),
      cgst_percent: parseFloat(item.originalItem.cgst_percent),
      sgst_percent: parseFloat(item.originalItem.sgst_percent),
    }));

    const customerDiscountPercent = parseFloat(parentInvoice.customer_discount_percent || 0);
    const billDiscountPercent = parseFloat(parentInvoice.bill_discount_percent || 0);

    const calculations = calculateInvoiceTotals(
      returnLineItems,
      customerDiscountPercent,
      billDiscountPercent
    );

    const returnInvoiceNumber = await generateSalesReturnNumber(shopId, branchId);

    const result = await prisma.$transaction(async (tx) => {
      const returnInvoice = await tx.salesInvoice.create({
        data: {
          invoice_number: returnInvoiceNumber,
          shop_id: shopId,
          branch_id: branchId,
          customer_id: parentInvoice.customer_id,
          walkin_name: parentInvoice.walkin_name,
          walkin_phone: parentInvoice.walkin_phone,
          invoice_date: new Date(),
          created_by: userId,
          confirmed_by: userId,
          confirmed_at: new Date(),

          is_return: true,
          parent_invoice_id: data.parent_invoice_id,
          return_reason: data.return_reason,
          return_notes: data.return_notes || null,

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

          payment_status: data.refund_mode === "CREDIT" ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.UNPAID,
          paid_amount: data.refund_mode === "CREDIT" ? calculations.net_amount : 0,
          balance_amount: data.refund_mode === "CREDIT" ? 0 : calculations.net_amount,

          status: INVOICE_STATUS.CONFIRMED,

          remarks: data.remarks || null,
        },
      });

      const createdItems = [];
      for (const item of validatedItems) {
        const itemCalc = calculateLineItem({
          quantity: item.returnQty,
          mrp: item.originalItem.mrp,
          discount_percent: item.originalItem.discount_percent,
          cgst_percent: item.originalItem.cgst_percent,
          sgst_percent: item.originalItem.sgst_percent,
        });

        const returnItem = await tx.salesInvoiceItem.create({
          data: {
            invoice_id: returnInvoice.invoice_id,
            medicine_id: item.originalItem.medicine_id,
            inventory_id: item.originalItem.inventory_id,
            batch_number: item.inventory.batch_number,
            expiry_date: item.inventory.expiry_date,
            quantity: item.returnQty,
            unit_of_measure: item.originalItem.unit_of_measure,
            mrp: item.originalItem.mrp,
            purchase_rate: item.originalItem.purchase_rate,
            discount_percent: item.originalItem.discount_percent,
            discount_amount: itemCalc.discount_amount,
            taxable_amount: itemCalc.taxable_amount,
            cgst_percent: item.originalItem.cgst_percent,
            cgst_amount: itemCalc.cgst_amount,
            sgst_percent: item.originalItem.sgst_percent,
            sgst_amount: itemCalc.sgst_amount,
            line_total: itemCalc.line_total,
          },
        });

        createdItems.push(returnItem);

        await tx.salesInvoiceItem.update({
          where: { item_id: item.originalItem.item_id },
          data: {
            returned_quantity: parseFloat(item.originalItem.returned_quantity || 0) + item.returnQty,
          },
        });

        const currentStock = parseFloat(item.inventory.current_stock);
        const currentAvailable = parseFloat(item.inventory.available_stock);

        await tx.inventory.update({
          where: { inventory_id: item.originalItem.inventory_id },
          data: {
            current_stock: currentStock + item.returnQty,
            available_stock: currentAvailable + item.returnQty,
          },
        });

        await tx.stockLedger.create({
          data: {
            shop_id: shopId,
            branch_id: branchId,
            medicine_id: item.originalItem.medicine_id,
            inventory_id: item.originalItem.inventory_id,
            batch_number: item.inventory.batch_number,
            expiry_date: item.inventory.expiry_date,
            movement_type: "SALE_RETURN",
            reference_type: "SALES_RETURN",
            reference_id: returnInvoice.invoice_id,
            reference_number: returnInvoiceNumber,
            quantity_in: item.returnQty,
            quantity_out: 0,
            quantity_net: item.returnQty,
            balance_after: currentStock + item.returnQty,
            rate: item.originalItem.mrp,
            amount: parseFloat(itemCalc.line_total),
            transaction_date: new Date(),
            created_by: userId,
            remarks: `Sales return: ${data.return_reason}`,
          },
        });
      }

      const refundAmount = calculations.net_amount;

      if (data.refund_mode === "CASH") {
        await tx.salesPayment.create({
          data: {
            invoice_id: returnInvoice.invoice_id,
            shop_id: shopId,
            branch_id: branchId,
            customer_id: parentInvoice.customer_id,
            payment_date: new Date(),
            amount: refundAmount,
            payment_mode: "CASH",
            status: "REFUNDED",
            remarks: `Cash refund for return ${returnInvoiceNumber}`,
            created_by: userId,
          },
        });

        await tx.salesInvoice.update({
          where: { invoice_id: returnInvoice.invoice_id },
          data: {
            payment_status: PAYMENT_STATUS.PAID,
            paid_amount: refundAmount,
            balance_amount: 0,
          },
        });

      } else if (data.refund_mode === "CREDIT" && parentInvoice.customer_id) {
        const customer = await tx.customer.findUnique({
          where: { customer_id: parentInvoice.customer_id },
        });

        const currentOutstanding = parseFloat(customer?.outstanding_balance || 0);
        const newOutstanding = Math.max(0, currentOutstanding - refundAmount);

        await tx.customerLedger.create({
          data: {
            customer_id: parentInvoice.customer_id,
            shop_id: shopId,
            branch_id: branchId,
            transaction_type: "RETURN",
            reference_type: "SALES_RETURN",
            reference_id: returnInvoice.invoice_id,
            reference_number: returnInvoiceNumber,
            debit_amount: 0,
            credit_amount: refundAmount,
            balance_after: newOutstanding,
            transaction_date: new Date(),
            remarks: `Credit for return: ${returnInvoiceNumber} (${data.return_reason})`,
            created_by: userId,
          },
        });

        await tx.customer.update({
          where: { customer_id: parentInvoice.customer_id },
          data: {
            outstanding_balance: newOutstanding,
          },
        });

      } else if (data.refund_mode === "ADJUST_NEXT") {
        await tx.salesInvoice.update({
          where: { invoice_id: returnInvoice.invoice_id },
          data: {
            remarks: `${data.remarks || ""}\n[STORE CREDIT: ₹${refundAmount} - To be adjusted in next purchase]`.trim(),
          },
        });
      }

      return {
        ...returnInvoice,
        lineItems: createdItems,
        refund_amount: refundAmount,
        refund_mode: data.refund_mode,
      };
    });

    await audit.log({
      action: audit.AuditAction.SALES_RETURN_CREATED,
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
        return_invoice_number: result.invoice_number,
        parent_invoice_number: parentInvoice.invoice_number,
        customer_name: parentInvoice.customer?.name || parentInvoice.walkin_name || "Walk-in",
        return_reason: data.return_reason,
        refund_mode: data.refund_mode,
        refund_amount: result.refund_amount,
        item_count: validatedItems.length,
      },
    });

    return result;
  }

  // ============================================
  // GET SALES RETURNS
  // ============================================

  async getSalesReturns(shopId, branchId, role, branchMode, filters = {}) {
    const {
      startDate,
      endDate,
      customerId,
      returnReason,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const where = {
      ...baseFilter,
      is_return: true,
      status: { not: INVOICE_STATUS.CANCELLED },
      ...(customerId && { customer_id: customerId }),
      ...(returnReason && { return_reason: returnReason }),
      ...(startDate && endDate && {
        invoice_date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search, mode: "insensitive" } },
          { parentInvoice: { invoice_number: { contains: search, mode: "insensitive" } } },
          { customer: { name: { contains: search, mode: "insensitive" } } },
          { walkin_name: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [returns, total] = await Promise.all([
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
          parentInvoice: {
            select: {
              invoice_id: true,
              invoice_number: true,
              invoice_date: true,
              net_amount: true,
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
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.salesInvoice.count({ where }),
    ]);

    return { returns, total };
  }

  // ============================================
  // GET RETURN DETAILS
  // ============================================

  async getReturnDetails(returnId, shopId, branchId, role, branchMode) {
    const baseFilter = buildBranchFilter(shopId, branchId, role, branchMode);

    const returnInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: returnId,
        ...baseFilter,
        is_return: true,
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
          },
        },
        parentInvoice: {
          select: {
            invoice_id: true,
            invoice_number: true,
            invoice_date: true,
            net_amount: true,
            payment_status: true,
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
              },
            },
            inventory: {
              select: {
                batch_number: true,
                expiry_date: true,
                rack_no: true,
              },
            },
          },
          orderBy: { created_at: "asc" },
        },
        payments: {
          orderBy: { payment_date: "desc" },
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });

    if (!returnInvoice) {
      throw new ApiError("Return invoice not found", 404, "NOT_FOUND");
    }

    return returnInvoice;
  }

  // ============================================
  // GET RETURNABLE ITEMS FOR AN INVOICE
  // ============================================

  async getReturnableItems(invoiceId, shopId, branchId) {
    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: invoiceId,
        shop_id: shopId,
        branch_id: branchId,
        status: INVOICE_STATUS.CONFIRMED,
        is_return: false,
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
                batch_number: true,
                expiry_date: true,
              },
            },
          },
        },
        customer: true,
        returnInvoices: {
          where: {
            status: { not: INVOICE_STATUS.CANCELLED },
          },
          select: {
            lineItems: {
              select: {
                medicine_id: true,
                inventory_id: true,
                quantity: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new ApiError("Invoice not found or not confirmed", 404, "NOT_FOUND");
    }

    const returnedQuantityMap = new Map();
    for (const returnInv of invoice.returnInvoices) {
      for (const item of returnInv.lineItems) {
        const key = `${item.medicine_id}_${item.inventory_id}`;
        const current = returnedQuantityMap.get(key) || 0;
        returnedQuantityMap.set(key, current + parseFloat(item.quantity));
      }
    }

    const returnableItems = invoice.lineItems.map((item) => {
      const key = `${item.medicine_id}_${item.inventory_id}`;
      const originalQty = parseFloat(item.quantity);
      const returnedQty = returnedQuantityMap.get(key) || 0;
      const returnableQty = originalQty - returnedQty;

      return {
        item_id: item.item_id,
        medicine_id: item.medicine_id,
        inventory_id: item.inventory_id,
        medicine_name: item.medicine.name,
        manufacturer: item.medicine.manufacturer,
        pack_size: item.medicine.pack_size,
        batch_number: item.inventory.batch_number,
        expiry_date: item.inventory.expiry_date,
        mrp: item.mrp,
        original_quantity: originalQty,
        returned_quantity: returnedQty,
        returnable_quantity: returnableQty,
        discount_percent: item.discount_percent,
        cgst_percent: item.cgst_percent,
        sgst_percent: item.sgst_percent,
        can_return: returnableQty > 0,
      };
    });

    return {
      invoice_id: invoice.invoice_id,
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      customer_name: invoice.customer?.name || invoice.walkin_name || "Walk-in",
      items: returnableItems,
      has_returnable_items: returnableItems.some((item) => item.can_return),
    };
  }

  // ============================================
  // CANCEL SALES RETURN
  // ============================================

  async cancelSalesReturn(userId, shopId, branchId, returnId, reason, auditContext) {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }

    if (user.role !== "super_admin") {
      throw new ApiError(
        "Only Super Admin can cancel sales returns",
        403,
        "PERMISSION_DENIED"
      );
    }

    const returnInvoice = await prisma.salesInvoice.findFirst({
      where: {
        invoice_id: returnId,
        shop_id: shopId,
        is_return: true,
        status: INVOICE_STATUS.CONFIRMED,
      },
      include: {
        lineItems: {
          include: {
            inventory: true,
          },
        },
        parentInvoice: true,
        customer: true,
        payments: true,
      },
    });

    if (!returnInvoice) {
      throw new ApiError(
        "Return invoice not found or already cancelled",
        404,
        "NOT_FOUND"
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of returnInvoice.lineItems) {
        const inventory = await tx.inventory.findUnique({
          where: { inventory_id: item.inventory_id },
        });

        if (inventory) {
          const currentStock = parseFloat(inventory.current_stock);
          const currentAvailable = parseFloat(inventory.available_stock);
          const returnQty = parseFloat(item.quantity);

          await tx.inventory.update({
            where: { inventory_id: item.inventory_id },
            data: {
              current_stock: Math.max(0, currentStock - returnQty),
              available_stock: Math.max(0, currentAvailable - returnQty),
            },
          });

          await tx.stockLedger.create({
            data: {
              shop_id: shopId,
              branch_id: returnInvoice.branch_id,
              medicine_id: item.medicine_id,
              inventory_id: item.inventory_id,
              batch_number: item.batch_number,
              expiry_date: item.expiry_date,
              movement_type: "SALE",
              reference_type: "RETURN_CANCELLATION",
              reference_id: returnInvoice.invoice_id,
              reference_number: `${returnInvoice.invoice_number}-CANCELLED`,
              quantity_in: 0,
              quantity_out: returnQty,
              quantity_net: -returnQty,
              balance_after: Math.max(0, currentStock - returnQty),
              rate: item.mrp,
              transaction_date: new Date(),
              created_by: userId,
              remarks: `Return cancelled: ${reason}`,
            },
          });
        }

        if (returnInvoice.parent_invoice_id) {
          const originalItem = await tx.salesInvoiceItem.findFirst({
            where: {
              invoice_id: returnInvoice.parent_invoice_id,
              medicine_id: item.medicine_id,
              inventory_id: item.inventory_id,
            },
          });

          if (originalItem) {
            const currentReturned = parseFloat(originalItem.returned_quantity || 0);
            await tx.salesInvoiceItem.update({
              where: { item_id: originalItem.item_id },
              data: {
                returned_quantity: Math.max(0, currentReturned - parseFloat(item.quantity)),
              },
            });
          }
        }
      }

      if (returnInvoice.customer_id) {
        const refundAmount = parseFloat(returnInvoice.net_amount);
        
        const creditLedgerEntry = await tx.customerLedger.findFirst({
          where: {
            reference_type: "SALES_RETURN",
            reference_id: returnInvoice.invoice_id,
            credit_amount: { gt: 0 },
          },
        });

        if (creditLedgerEntry) {
          const customer = await tx.customer.findUnique({
            where: { customer_id: returnInvoice.customer_id },
          });

          const currentOutstanding = parseFloat(customer?.outstanding_balance || 0);
          const newOutstanding = currentOutstanding + refundAmount;

          await tx.customerLedger.create({
            data: {
              customer_id: returnInvoice.customer_id,
              shop_id: shopId,
              branch_id: returnInvoice.branch_id,
              transaction_type: "ADJUSTMENT",
              reference_type: "RETURN_CANCELLATION",
              reference_id: returnInvoice.invoice_id,
              reference_number: `${returnInvoice.invoice_number}-CANCELLED`,
              debit_amount: refundAmount,
              credit_amount: 0,
              balance_after: newOutstanding,
              transaction_date: new Date(),
              remarks: `Return cancellation: ${reason}`,
              created_by: userId,
            },
          });

          await tx.customer.update({
            where: { customer_id: returnInvoice.customer_id },
            data: {
              outstanding_balance: newOutstanding,
            },
          });
        }
      }

      const cancelledReturn = await tx.salesInvoice.update({
        where: { invoice_id: returnId },
        data: {
          status: INVOICE_STATUS.CANCELLED,
          cancelled_at: new Date(),
          cancelled_by: userId,
          cancellation_reason: reason,
        },
      });

      return cancelledReturn;
    });

    await audit.log({
      action: audit.AuditAction.SALES_RETURN_CANCELLED,
      entity_type: audit.EntityType.SALES_INVOICE,
      entity_id: returnId,
      shop_id: shopId,
      branch_id: returnInvoice.branch_id,
      actor_type: audit.ActorType.ERP_USER,
      actor_id: userId,
      actor_role: user.role,
      ...auditContext,
      reason_code: audit.AuditReasonCode.SUPER_ADMIN_OVERRIDE,
      metadata: {
        return_invoice_number: returnInvoice.invoice_number,
        parent_invoice_number: returnInvoice.parentInvoice?.invoice_number,
        cancellation_reason: reason,
        refund_amount: returnInvoice.net_amount,
      },
    });

    return result;
  }
}

export default new SalesReturnService();