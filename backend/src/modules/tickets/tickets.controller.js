// backend/src/modules/tickets/tickets.controller.js

import { success, fail } from "../../utils/response.js";
import * as svc from "./tickets.service.js";

/**
 * POST /api/tickets
 * Create a new support ticket with attachments
 */
export async function createTicketController(req, res) {
  try {
    const { shop_id, branch_id: userBranchId, user_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role !== "super_admin" && role !== "branch_admin") {
      return fail(res, "You do not have permission to create tickets", 403);
    }

    const {
      contact_number,
      category,
      subject,
      description,
      other_category_text,
      preferred_slot,
      branch_id,
    } = req.body;

    const files = req.files || [];

    const ticket = await svc.createTicket({
      shop_id,
      branch_id: branch_id || userBranchId || null,
      user_id,
      user_branch_id: userBranchId,
      user_role: role,
      contact_number,
      category,
      subject,
      description,
      other_category_text,
      preferred_slot,
      files,
    });

    return success(res, { ticket }, "Ticket created successfully", 201);
  } catch (err) {
    console.error("createTicketController error:", err.code, err.message);

    // Handle specific error codes
    const errorCodeMap = {
      INVALID_BRANCH: 400,
      BRANCH_ACCESS_DENIED: 403,
      RATE_LIMIT_EXCEEDED: 429,
      DUPLICATE_TICKET: 409,
      TICKET_NUMBER_CONFLICT: 500,
    };

    const statusCode = errorCodeMap[err.code] || 500;
    return fail(res, err.message || "Failed to create ticket", statusCode);
  }
}

/**
 * GET /api/tickets
 * List tickets with filtering and pagination
 */
export async function getTicketsController(req, res) {
  try {
    const { shop_id, role, branch_id: requesterBranchId } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role !== "super_admin" && role !== "branch_admin") {
      return fail(res, "You do not have permission to view tickets", 403);
    }

    const result = await svc.getTickets({
      shop_id,
      requester_role: role,
      requester_branch_id: requesterBranchId,
      ...req.query,
    });

    return success(res, result);
  } catch (err) {
    console.error("getTicketsController error:", err.message);
    return fail(res, "Failed to fetch tickets", 500);
  }
}

/**
 * GET /api/tickets/stats
 * Get ticket statistics
 */
export async function getTicketStatsController(req, res) {
  try {
    const { shop_id, role, branch_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role !== "super_admin" && role !== "branch_admin") {
      return fail(res, "You do not have permission to view ticket stats", 403);
    }

    const stats = await svc.getTicketStats(shop_id, role, branch_id);

    return success(res, { stats });
  } catch (err) {
    console.error("getTicketStatsController error:", err.message);
    return fail(res, "Failed to fetch ticket stats", 500);
  }
}

/**
 * GET /api/tickets/:ticket_id
 * Get single ticket details
 */
export async function getTicketController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { shop_id, role, branch_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (role !== "super_admin" && role !== "branch_admin") {
      return fail(res, "You do not have permission to view tickets", 403);
    }

    const hasAccess = await svc.canAccessTicket(ticket_id, shop_id, role, branch_id);

    if (!hasAccess) {
      return fail(res, "Ticket not found or access denied", 404);
    }

    const ticket = await svc.getTicketById(ticket_id, shop_id);

    if (!ticket) {
      return fail(res, "Ticket not found", 404);
    }

    return success(res, { ticket });
  } catch (err) {
    console.error("getTicketController error:", err.message);
    return fail(res, "Failed to fetch ticket", 500);
  }
}

/**
 * POST /api/tickets/:ticket_id/cancel
 * Cancel a ticket
 */
export async function cancelTicketController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { shop_id, user_id, role, branch_id } = req.user;
    const { reason } = req.body;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (!reason || reason.trim().length < 10) {
      return fail(res, "Cancellation reason must be at least 10 characters", 400);
    }

    if (role !== "super_admin" && role !== "branch_admin") {
      return fail(res, "You do not have permission to cancel tickets", 403);
    }

    const hasAccess = await svc.canAccessTicket(ticket_id, shop_id, role, branch_id);

    if (!hasAccess) {
      return fail(res, "Ticket not found or access denied", 404);
    }

    const ticket = await svc.cancelTicket(ticket_id, shop_id, user_id, reason.trim());

    return success(res, { ticket }, "Ticket cancelled successfully");
  } catch (err) {
    console.error("cancelTicketController error:", err.code, err.message);

    const errorCodeMap = {
      TICKET_NOT_FOUND: 404,
      ALREADY_CANCELLED: 400,
      INVALID_STATUS_TRANSITION: 400,
    };

    const statusCode = errorCodeMap[err.code] || 500;
    return fail(res, err.message || "Failed to cancel ticket", statusCode);
  }
}

/**
 * POST /api/tickets/:ticket_id/reopen
 * Reopen a resolved or closed ticket
 */
export async function reopenTicketController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { shop_id, user_id, role, branch_id } = req.user;
    const { reason } = req.body;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (!reason || reason.trim().length < 10) {
      return fail(res, "Reopen reason must be at least 10 characters", 400);
    }

    if (role !== "super_admin" && role !== "branch_admin") {
      return fail(res, "You do not have permission to reopen tickets", 403);
    }

    const hasAccess = await svc.canAccessTicket(ticket_id, shop_id, role, branch_id);

    if (!hasAccess) {
      return fail(res, "Ticket not found or access denied", 404);
    }

    const ticket = await svc.reopenTicket(ticket_id, shop_id, user_id, reason.trim());

    return success(res, { ticket }, "Ticket reopened successfully");
  } catch (err) {
    console.error("reopenTicketController error:", err.code, err.message);

    const errorCodeMap = {
      TICKET_NOT_FOUND: 404,
      INVALID_STATUS_FOR_REOPEN: 400,
      CANNOT_REOPEN_CANCELLED: 400,
      REOPEN_LIMIT_EXCEEDED: 400,
    };

    const statusCode = errorCodeMap[err.code] || 500;
    return fail(res, err.message || "Failed to reopen ticket", statusCode);
  }
}