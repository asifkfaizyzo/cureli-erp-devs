// ============================================
// backend\src\modules\cadmin\tickets\cadminTickets.controller.js
// ============================================

import { success, fail } from "../../../utils/response.js";
import * as svc from "./cadminTickets.service.js";
import * as audit from "../../audit/index.js";

/**
 * GET /cadmin/tickets
 * List all tickets with filters
 */
export async function getAllTicketsController(req, res) {
  try {
    const result = await svc.getAllTickets(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("getAllTicketsController error:", err);
    return fail(res, "Failed to fetch tickets", 500);
  }
}

/**
 * GET /cadmin/tickets/stats
 * Get ticket statistics
 */
export async function getTicketStatsController(req, res) {
  try {
    const stats = await svc.getTicketStats();
    return success(res, stats);
  } catch (err) {
    console.error("getTicketStatsController error:", err);
    return fail(res, "Failed to fetch ticket stats", 500);
  }
}

/**
 * GET /cadmin/tickets/:ticket_id
 * Get single ticket details
 */
export async function getTicketByIdController(req, res) {
  try {
    const { ticket_id } = req.params;
    const ticket = await svc.getTicketById(ticket_id);

    if (!ticket) {
      return fail(res, "Ticket not found", 404);
    }

    return success(res, { ticket });
  } catch (err) {
    console.error("getTicketByIdController error:", err);
    return fail(res, "Failed to fetch ticket", 500);
  }
}

/**
 * GET /cadmin/tickets/:ticket_id/history
 * Get ticket status change history
 */
export async function getTicketHistoryController(req, res) {
  try {
    const { ticket_id } = req.params;
    const history = await svc.getTicketStatusHistory(ticket_id);
    return success(res, { history });
  } catch (err) {
    console.error("getTicketHistoryController error:", err);

    if (err.code === "TICKET_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, "Failed to fetch ticket history", 500);
  }
}

/**
 * PATCH /cadmin/tickets/:ticket_id/status
 * Update ticket status (by admin)
 */
export async function updateTicketStatusController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { status, note } = req.validated;
    const cadmin_id = req.cadmin.cadmin_id;

    if (!status) {
      return fail(res, "Status is required", 400);
    }

    const auditContext = audit.extractRequestContext(req);
    const ticket = await svc.updateTicketStatus(
      ticket_id,
      status,
      note,
      cadmin_id,
      auditContext
    );

    return success(res, { ticket }, "Ticket updated successfully");
  } catch (err) {
    console.error("updateTicketStatusController error:", err);

    if (err.code === "TICKET_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (
      err.code === "INVALID_STATUS" ||
      err.code === "CANNOT_UPDATE_CANCELLED" ||
      err.code === "SAME_STATUS"
    ) {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to update ticket", 500);
  }
}