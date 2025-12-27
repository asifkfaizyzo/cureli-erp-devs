// src/modules/tickets/tickets.controller.js

import { success, fail } from "../../utils/response.js";
import {
  createTicket,
  getTickets,
  getTicketById,
  cancelTicket,
  reopenTicket,
  getTicketStats,
  canAccessTicket,
} from "./tickets.service.js";

/**
 * POST /api/tickets
 * Create a new support ticket
 */
export async function createTicketController(req, res) {
  try {
    const { shop_id, branch_id, user_id, role } = req.user;
    const {
      contact_number,
      category,
      subject,
      description,
      other_category_text,
      preferred_slot,
      attachment_ids,
    } = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    if (!branch_id) {
      return fail(res, "Branch not found", 400);
    }

    // Only super_admin and branch_admin can create tickets
    if (role !== "super_admin" && role !== "branch_admin") {
      return fail(res, "You do not have permission to create tickets", 403);
    }

    const ticket = await createTicket({
      shop_id,
      branch_id,
      user_id,
      contact_number,
      category,
      subject,
      description,
      other_category_text,
      preferred_slot,
      attachment_ids,
    });

    return success(res, { ticket }, "Ticket created successfully", 201);
  } catch (err) {
    console.error("createTicketController error:", err);

    if (err.code === "INVALID_BRANCH") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to create ticket", 500);
  }
}

/**
 * GET /api/tickets
 * List tickets with filtering and pagination
 */
export async function getTicketsController(req, res) {
  try {
    const { shop_id, role: requester_role, branch_id: requester_branch_id } = req.user;
    const {
      status,
      category,
      branch_id,
      search,
      date_from,
      date_to,
      page,
      limit,
      sort_by,
      sort_order,
    } = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super_admin and branch_admin can view tickets
    if (requester_role !== "super_admin" && requester_role !== "branch_admin") {
      return fail(res, "You do not have permission to view tickets", 403);
    }

    const result = await getTickets({
      shop_id,
      branch_id,
      status,
      category,
      search,
      date_from,
      date_to,
      page,
      limit,
      sort_by,
      sort_order,
      requester_role,
      requester_branch_id,
    });

    return success(res, result);
  } catch (err) {
    console.error("getTicketsController error:", err);
    return fail(res, "Failed to fetch tickets", 500);
  }
}

/**
 * GET /api/tickets/stats
 * Get ticket statistics
 */
export async function getTicketStatsController(req, res) {
  try {
    const { shop_id, role: requester_role, branch_id: requester_branch_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super_admin and branch_admin can view stats
    if (requester_role !== "super_admin" && requester_role !== "branch_admin") {
      return fail(res, "You do not have permission to view ticket stats", 403);
    }

    const stats = await getTicketStats(shop_id, requester_role, requester_branch_id);

    return success(res, { stats });
  } catch (err) {
    console.error("getTicketStatsController error:", err);
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
    const { shop_id, role: requester_role, branch_id: requester_branch_id } = req.user;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super_admin and branch_admin can view tickets
    if (requester_role !== "super_admin" && requester_role !== "branch_admin") {
      return fail(res, "You do not have permission to view tickets", 403);
    }

    // Check access
    const hasAccess = await canAccessTicket(
      ticket_id,
      shop_id,
      requester_role,
      requester_branch_id
    );

    if (!hasAccess) {
      return fail(res, "Ticket not found or access denied", 404);
    }

    const ticket = await getTicketById(ticket_id, shop_id);

    if (!ticket) {
      return fail(res, "Ticket not found", 404);
    }

    return success(res, { ticket });
  } catch (err) {
    console.error("getTicketController error:", err);
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
    const { shop_id, user_id, role: requester_role, branch_id: requester_branch_id } = req.user;
    const { reason } = req.validated;

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super_admin and branch_admin can cancel tickets
    if (requester_role !== "super_admin" && requester_role !== "branch_admin") {
      return fail(res, "You do not have permission to cancel tickets", 403);
    }

    // Check access
    const hasAccess = await canAccessTicket(
      ticket_id,
      shop_id,
      requester_role,
      requester_branch_id
    );

    if (!hasAccess) {
      return fail(res, "Ticket not found or access denied", 404);
    }

    const ticket = await cancelTicket(ticket_id, shop_id, user_id, reason);

    return success(res, { ticket }, "Ticket cancelled successfully");
  } catch (err) {
    console.error("cancelTicketController error:", err);

    if (err.code === "TICKET_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "ALREADY_CANCELLED") {
      return fail(res, err.message, 400);
    }
    if (err.code === "INVALID_STATUS_TRANSITION") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to cancel ticket", 500);
  }
}

/**
 * POST /api/tickets/:ticket_id/reopen
 * Reopen a cancelled ticket
 */
export async function reopenTicketController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { shop_id, user_id, role: requester_role, branch_id: requester_branch_id } = req.user;
    const { reason } = req.validated || {};

    if (!shop_id) {
      return fail(res, "Shop not found", 400);
    }

    // Only super_admin and branch_admin can reopen tickets
    if (requester_role !== "super_admin" && requester_role !== "branch_admin") {
      return fail(res, "You do not have permission to reopen tickets", 403);
    }

    // Check access
    const hasAccess = await canAccessTicket(
      ticket_id,
      shop_id,
      requester_role,
      requester_branch_id
    );

    if (!hasAccess) {
      return fail(res, "Ticket not found or access denied", 404);
    }

    const ticket = await reopenTicket(ticket_id, shop_id, user_id, reason);

    return success(res, { ticket }, "Ticket reopened successfully");
  } catch (err) {
    console.error("reopenTicketController error:", err);

    if (err.code === "TICKET_NOT_FOUND") {
      return fail(res, err.message, 404);
    }
    if (err.code === "INVALID_STATUS_TRANSITION") {
      return fail(res, err.message, 400);
    }

    return fail(res, "Failed to reopen ticket", 500);
  }
}