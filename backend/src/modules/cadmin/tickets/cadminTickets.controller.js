// backend/src/modules/cadmin/tickets/cadminTickets.controller.js

import { success, fail } from "../../../utils/response.js";
import {
  getAllTickets,
  getTicketById,
  updateTicketStatus,
  addAdminNote,
  getTicketStats,
} from "./cadminTickets.service.js";

/**
 * GET /cadmin/tickets
 * Get all tickets from all shops (Super Admin view)
 */
export async function getAllTicketsController(req, res) {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      status = "",
      category = "",
      shop_name = "",
      date_from = "",
      date_to = "",
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const result = await getAllTickets({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      category,
      shop_name,
      date_from,
      date_to,
      sort_by,
      sort_order,
    });

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
    const { status, admin_notes } = req.body;

    console.log("📥 Update status request:", {
      ticket_id,
      status,
      has_notes: !!admin_notes,
    });

    if (!status) {
      return fail(res, "Status is required", 400);
    }

    // ✅ FIXED: Pass as separate arguments, not as object
    const ticket = await updateTicketStatus(ticket_id, status, admin_notes);

    return success(res, { ticket }, "Ticket status updated successfully");
  } catch (err) {
    console.error("❌ updateTicketStatusController error:", err);

    if (err.code === "TICKET_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    if (err.code === "INVALID_STATUS") {
      return fail(res, err.message, 400);
    }

    return fail(res, err.message || "Failed to update ticket status", 500);
  }
}

/**
 * POST /cadmin/tickets/:ticket_id/notes
 * Add admin note to ticket
 */
export async function addAdminNoteController(req, res) {
  try {
    const { ticket_id } = req.params;
    const { note } = req.body;
    const cadmin_id = req.cadmin.cadmin_id;

    if (!note || note.trim() === "") {
      return fail(res, "Note is required", 400);
    }

    // ✅ FIXED: Pass as separate arguments, not as object
    const ticket = await addAdminNote(ticket_id, note, cadmin_id);

    return success(res, { ticket }, "Admin note added successfully");
  } catch (err) {
    console.error("❌ addAdminNoteController error:", err);

    if (err.code === "TICKET_NOT_FOUND") {
      return fail(res, err.message, 404);
    }

    return fail(res, "Failed to add admin note", 500);
  }
}
