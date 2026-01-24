// backend/src/modules/purchase/purchase.controller.js
import { success, fail } from "../../utils/response.js";
import * as purchaseService from "./purchase.service.js";
import * as audit from "../audit/index.js";

export async function createPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const branchId = req.user.branch_id;
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    // ✅ ADD LOGGING
    console.log("=== Purchase Invoice Create ===");
    console.log("User ID:", userId);
    console.log("Shop ID:", shopId);
    console.log("Branch ID:", branchId);
    console.log("Data:", JSON.stringify(data, null, 2));

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.createPurchaseInvoice(
      userId,
      shopId,
      branchId,
      data,
      auditContext
    );

    return success(res, invoice, "Purchase invoice created successfully", 201);
  } catch (error) {
    console.error("purchase.createInvoice ERROR:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    const statusCode = error.code === "NOT_FOUND" ? 404 : 400;
    return fail(res, error.message || "Failed to create purchase invoice", statusCode);
  }
}

export async function confirmPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const branchId = req.user.branch_id;
    const { invoiceId } = req.params;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.confirmPurchaseInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
      auditContext
    );

    return success(res, invoice, "Purchase invoice confirmed and stock updated successfully");
  } catch (error) {
    console.error("purchase.confirmInvoice ERROR:", error);
    const statusCode = error.code === "NOT_FOUND" ? 404 : 400;
    return fail(res, error.message || "Failed to confirm purchase invoice", statusCode);
  }
}

export async function getPurchaseInvoicesController(req, res) {
  try {
    const shopId = req.user.shop_id;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplierId: req.query.supplierId,
      branchId: req.query.branchId,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    const result = await purchaseService.getPurchaseInvoices(shopId, filters);
    return success(res, result, "Purchase invoices retrieved successfully");
  } catch (error) {
    console.error("purchase.getInvoices ERROR:", error);
    return fail(res, error.message || "Failed to retrieve purchase invoices", 500);
  }
}

export async function getInvoiceDetailsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const { invoiceId } = req.params;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.getInvoiceDetails(invoiceId, shopId);
    return success(res, invoice, "Invoice details retrieved successfully");
  } catch (error) {
    console.error("purchase.getInvoiceDetails ERROR:", error);
    const statusCode = error.code === "NOT_FOUND" ? 404 : 500;
    return fail(res, error.message || "Failed to retrieve invoice details", statusCode);
  }
}

export async function updatePurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const branchId = req.user.branch_id;
    const { invoiceId } = req.params;
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.updatePurchaseInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
      data,
      auditContext
    );

    return success(res, invoice, "Purchase invoice updated successfully");
  } catch (error) {
    console.error("purchase.updateInvoice ERROR:", error);
    const statusCode = error.code === "NOT_FOUND" ? 404 : 400;
    return fail(res, error.message || "Failed to update purchase invoice", statusCode);
  }
}

export async function cancelPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const branchId = req.user.branch_id;
    const { invoiceId } = req.params;
    const { reason } = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const invoice = await purchaseService.cancelPurchaseInvoice(
      userId,
      shopId,
      branchId,
      invoiceId,
      reason,
      auditContext
    );

    return success(res, invoice, "Purchase invoice cancelled successfully");
  } catch (error) {
    console.error("purchase.cancelInvoice ERROR:", error);
    const statusCode = error.code === "NOT_FOUND" ? 404 : 400;
    return fail(res, error.message || "Failed to cancel purchase invoice", statusCode);
  }
}

export async function getPurchaseStatsController(req, res) {
  try {
    const shopId = req.user.shop_id;

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      branchId: req.query.branchId,
    };

    const stats = await purchaseService.getPurchaseStats(shopId, filters);
    return success(res, stats, "Purchase statistics retrieved successfully");
  } catch (error) {
    console.error("purchase.getStats ERROR:", error);
    return fail(res, error.message || "Failed to retrieve purchase statistics", 500);
  }
}