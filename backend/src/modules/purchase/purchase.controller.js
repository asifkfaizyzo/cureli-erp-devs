// backend/src/modules/purchase/purchase.controller.js

import { success, fail } from "../../utils/response.js";
import * as purchaseService from "./purchase.service.js";
import * as audit from "../audit/index.js";

/**
 * Extract branch context from request headers
 * Frontend sends: X-Branch-Mode and X-Branch-Id headers
 */
function extractBranchContext(req) {
  const branchMode = req.headers["x-branch-mode"] || "BRANCH";
  const headerBranchId = req.headers["x-branch-id"] || null;
  
  // For super_admin: use header branch context
  // For others: use their assigned branch_id from JWT
  if (req.user.role === "super_admin") {
    return {
      branchId: branchMode === "GLOBAL" ? null : headerBranchId,
      branchMode,
    };
  }
  
  // branch_admin/staff: always use their assigned branch
  return {
    branchId: req.user.branch_id,
    branchMode: "BRANCH",
  };
}

export async function createPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    console.log("=== Purchase Invoice Create ===");
    console.log("User ID:", userId);
    console.log("Shop ID:", shopId);
    console.log("Branch ID:", branchId);
    console.log("Branch Mode:", branchMode);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    // ✅ Validate branch for write operations
    if (!branchId) {
      return fail(res, "Please select a specific branch to create purchase invoices", 400, {
        code: "BRANCH_REQUIRED"
      });
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
    
    const statusCode = error.code === "NOT_FOUND" ? 404 : 
                       error.code === "BRANCH_REQUIRED" ? 400 :
                       error.code === "BRANCH_MISMATCH" ? 400 : 400;
    return fail(res, error.message || "Failed to create purchase invoice", statusCode);
  }
}

export async function confirmPurchaseInvoiceController(req, res) {
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const { branchId } = extractBranchContext(req);
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
    const statusCode = error.code === "NOT_FOUND" ? 404 : 
                       error.code === "BRANCH_ACCESS_DENIED" ? 403 : 400;
    return fail(res, error.message || "Failed to confirm purchase invoice", statusCode);
  }
}

export async function getPurchaseInvoicesController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

     console.log("=== GET PURCHASE INVOICES ===");
    console.log("User Role:", role);
    console.log("X-Branch-Mode header:", req.headers["x-branch-mode"]);
    console.log("X-Branch-Id header:", req.headers["x-branch-id"]);
    console.log("Extracted branchId:", branchId);
    console.log("Extracted branchMode:", branchMode);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplierId: req.query.supplierId,
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
    };

    // ✅ UPDATED: Pass branch context
    const result = await purchaseService.getPurchaseInvoices(
      shopId, 
      branchId,
      role,
      branchMode,
      filters
    );
    
    return success(res, result, "Purchase invoices retrieved successfully");
  } catch (error) {
    console.error("purchase.getInvoices ERROR:", error);
    return fail(res, error.message || "Failed to retrieve purchase invoices", 500);
  }
}

export async function getInvoiceDetailsController(req, res) {
  try {
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    // ✅ UPDATED: Pass branch context
    const invoice = await purchaseService.getInvoiceDetails(
      invoiceId, 
      shopId,
      branchId,
      role,
      branchMode
    );
    
    return success(res, invoice, "Invoice details retrieved successfully");
  } catch (error) {
    console.error("purchase.getInvoiceDetails ERROR:", error);
    const statusCode = error.code === "NOT_FOUND" ? 404 : 500;
    return fail(res, error.message || "Failed to retrieve invoice details", statusCode);
  }
}

export async function updatePurchaseInvoiceController(req, res) {
  console.log("=== UPDATE INVOICE REQUEST ===");
  console.log("Invoice ID:", req.params.invoiceId);
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("Validated:", req.validated);
  try {
    const userId = req.user.user_id;
    const shopId = req.user.shop_id;
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);
    const data = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    // ✅ UPDATED: Pass branch context
    const invoice = await purchaseService.updatePurchaseInvoice(
      userId,
      shopId,
      branchId,
      role,
      branchMode,
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
    const role = req.user.role;
    const { invoiceId } = req.params;
    const { branchId, branchMode } = extractBranchContext(req);
    const { reason } = req.validated;
    const auditContext = audit.extractRequestContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    // ✅ UPDATED: Pass branch context
    const invoice = await purchaseService.cancelPurchaseInvoice(
      userId,
      shopId,
      branchId,
      role,
      branchMode,
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
    const role = req.user.role;
    const { branchId, branchMode } = extractBranchContext(req);

    if (!shopId) {
      return fail(res, "No shop associated with your account", 400);
    }

    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    // ✅ UPDATED: Pass branch context
    const stats = await purchaseService.getPurchaseStats(
      shopId, 
      branchId,
      role,
      branchMode,
      filters
    );
    
    return success(res, stats, "Purchase statistics retrieved successfully");
  } catch (error) {
    console.error("purchase.getStats ERROR:", error);
    return fail(res, error.message || "Failed to retrieve purchase statistics", 500);
  }
}