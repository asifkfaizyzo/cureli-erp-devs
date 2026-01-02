// backend/src/modules/cadmin/tickets/cadminTickets.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  getTicketStats,
} from "./cadminTickets.service.js";

/**
 * GET /cadmin/tickets
 * Get all tickets from all shops (Super Admin view)
 */
export async function getAllTicketsController(req, res) {
  try {
    // ✅ Use req.validated instead of req.query
    const result = await getAllTickets(req.validated);
    return success(res, result);
  } catch (err) {
    console.error("getAllTicketsController error:", err);
    return fail(res, "Failed to fetch tickets", 500);
  }
}

/**
 * GET /cadmin/tickets/stats
 * Get ticket statistics across all shops
 */
export async function getTicketStatsController(req, res) {
  try {
    const stats = await getTicketStats();
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
    const ticket = await getTicketById(ticket_id);

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
 * PATCH /cadmin/tickets/:ticket_id/status
 * Update ticket status (Admin action)
 */
export async function updateTicketStatusController(req, res) {
  try {
    const { ticket_id } = req.params;
    // ✅ Use req.validated for body data too
    const { status, admin_notes } = req.validated;
    const cadmin_id = req.cadmin.cadmin_id;

    if (!status) {
      return fail(res, "Status is required", 400);
    }

    const ticket = await updateTicketStatus(ticket_id, status, admin_notes, cadmin_id);

    return success(res, { ticket }, "Ticket updated successfully");
  } catch (err) {
    console.error("updateTicketStatusController error:", err);

    if (err.code === "TICKET_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "INVALID_STATUS" || err.code === "CANNOT_UPDATE_CANCELLED") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to update ticket", 500);
  }
}