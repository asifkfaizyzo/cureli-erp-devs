// backend/src/modules/cadmin/tickets/cadminTickets.service.js

import prisma from "../../../config/prisma.js";

/**
 * ============================================
 * GET ALL TICKETS (Super Admin - All Shops)
 * ============================================
 */
export async function getAllTickets({
  page,
  limit,
  search,
  status,
  category,
  shop_name,
  date_from,
  date_to,
  sort_by,
  sort_order,
}) {
  try {
    // Build where clause
    const where = {
      status: { not: "CANCELLED" }, // ✅ Exclude cancelled tickets
    };

    // Search filter
    if (search) {
      where.OR = [
        { ticket_number: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter - only if explicitly requested
    if (status) {
      where.status = status;
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Shop name filter
    if (shop_name) {
      where.shop = {
        business_name: { contains: shop_name, mode: "insensitive" },
      };
    }

    // Date range filter
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) {
        where.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        const endDate = new Date(date_to);
        endDate.setDate(endDate.getDate() + 1);
        where.created_at.lt = endDate;
      }
    }

    console.log("📋 Fetching tickets with where:", JSON.stringify(where, null, 2));

    const total = await prisma.ticket.count({ where });

    const tickets = await prisma.ticket.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sort_by]: sort_order,
      },
      include: {
        shop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        created_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        cancelled_by: { // ✅ ADDED
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        reopened_by: { // ✅ ADDED
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        attachments: {
          select: {
            attachment_id: true,
            storage_key: true,
            original_name: true,
            mime_type: true,
            file_size: true,
          },
        },
        _count: {
          select: {
            attachments: true,
          },
        },
      },
    });

    console.log(`✅ Found ${tickets.length} tickets out of ${total} total`);

    return {
      tickets: tickets.map(transformTicketForCAdmin),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("❌ getAllTickets error:", error);
    throw error;
  }
}

/**
 * ============================================
 * GET TICKET BY ID (Super Admin)
 * ============================================
 */
export async function getTicketById(ticket_id) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
      include: {
        shop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        created_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
            phone_number: true,
          },
        },
        cancelled_by: { // ✅ CRITICAL
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        reopened_by: { // ✅ CRITICAL
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        attachments: {
          select: {
            attachment_id: true,
            storage_key: true,
            original_name: true,
            mime_type: true,
            file_size: true,
            uploaded_at: true,
          },
        },
      },
    });

    if (!ticket) return null;

    // ✅ Debug log
    console.log("🔍 CAdmin fetched ticket:", {
      ticket_id: ticket.ticket_id,
      reopen_count: ticket.reopen_count,
      reopened_by_id: ticket.reopened_by_id,
      reopened_by: ticket.reopened_by,
      reopen_reason: ticket.reopen_reason,
    });

    return transformTicketForCAdmin(ticket);
  } catch (error) {
    console.error("❌ getTicketById error:", error);
    throw error;
  }
}

/**
 * ============================================
 * UPDATE TICKET STATUS (Admin Action)
 * ============================================
 */
/**
 * ============================================
 * UPDATE TICKET STATUS (Admin Action)
 * ============================================
 */
export async function updateTicketStatus(ticket_id, status, admin_notes) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
    });

    if (!ticket) {
      const err = new Error("Ticket not found");
      err.code = "TICKET_NOT_FOUND";
      throw err;
    }

    // Validate status
    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      const err = new Error("Invalid status");
      err.code = "INVALID_STATUS";
      throw err;
    }

    // Build update data
    const updateData = {
      status,
      updated_at: new Date(),
    };

    // Only update admin_notes if provided
    if (admin_notes !== undefined && admin_notes !== null) {
      updateData.admin_notes = admin_notes;
    }

    console.log("🔄 Updating ticket:", {
      ticket_id,
      status,
      has_admin_notes: !!admin_notes,
    });

    const updatedTicket = await prisma.ticket.update({
      where: { ticket_id },
      data: updateData,
      include: {
        shop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        created_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        cancelled_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        reopened_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        attachments: {
          select: {
            attachment_id: true,
            storage_key: true,
            original_name: true,
            mime_type: true,
            file_size: true,
          },
        },
      },
    });

    console.log("✅ Ticket updated successfully:", updatedTicket.ticket_number);

    return transformTicketForCAdmin(updatedTicket);
  } catch (error) {
    console.error("❌ updateTicketStatus error:", error);
    throw error;
  }
}


/**
 * ============================================
 * ADD ADMIN NOTE
 * ============================================
 */
export async function getTicketStats() {
  try {
    const [total, pending, in_progress, resolved, cancelled, closed] =
      await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.count({ where: { status: "PENDING" } }),
        prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
        prisma.ticket.count({ where: { status: "RESOLVED" } }),
        prisma.ticket.count({ where: { status: "CANCELLED" } }),
        prisma.ticket.count({ where: { status: "CLOSED" } }),
      ]);

    console.log("📊 Stats calculated:", {
      total,
      pending,
      in_progress,
      resolved,
      cancelled,
      closed,
    });

    return {
      total,
      pending,
      in_progress,
      resolved,
      cancelled,
      closed,
    };
  } catch (error) {
    console.error("❌ getTicketStats error:", error);
    throw error;
  }
}




/**
 * ============================================
 * HELPER: Transform ticket for CAdmin response
 * ============================================
 */
function transformTicketForCAdmin(ticket) {
  return {
    ticket_id: ticket.ticket_id,
    ticket_number: ticket.ticket_number,

    // Shop & Branch
    shop_id: ticket.shop_id,
    shop_name: ticket.shop?.business_name || null,
    branch_id: ticket.branch_id,
    branch_name: ticket.branch?.branch_name || null,

    // Creator info
    created_by_user_id: ticket.created_by_user_id,
    created_by_name: ticket.created_by?.full_name || null,
    created_by_role: ticket.created_by?.role || null,

    // Contact & Issue
    contact_number: ticket.contact_number,
    category: ticket.category,
    other_category_text: ticket.other_category_text,
    subject: ticket.subject,
    description: ticket.description,
    preferred_slot: ticket.preferred_slot,

    // Status & Notes
    status: ticket.status,
    admin_notes: ticket.admin_notes,

    // Cancellation
    cancelled_at: ticket.cancelled_at,
    cancelled_by_id: ticket.cancelled_by_id,
    cancelled_by_name: ticket.cancelled_by?.full_name || null,
    cancellation_reason: ticket.cancellation_reason,

    // Reopening ✅ ALL FIELDS INCLUDED
    reopened_at: ticket.reopened_at,
    reopened_by_id: ticket.reopened_by_id,
    reopened_by_name: ticket.reopened_by?.full_name || null, // ✅ Should work now
    reopen_count: ticket.reopen_count || 0,
    reopen_reason: ticket.reopen_reason, // ✅ ADDED

    // Attachments
    attachments: ticket.attachments || [],
    attachment_count: ticket._count?.attachments || ticket.attachments?.length || 0,

    // Timestamps
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

/**
 * ============================================
 * ADD ADMIN NOTE
 * ============================================
 */
export async function addAdminNote(ticket_id, note, cadmin_id) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
    });

    if (!ticket) {
      const err = new Error("Ticket not found");
      err.code = "TICKET_NOT_FOUND";
      throw err;
    }

    // Get admin details
    const admin = await prisma.cAdmin.findUnique({
      where: { cadmin_id },
      select: { name: true },
    });

    // Format timestamp
    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // Build new note entry
    const newNoteEntry = `[${timestamp}] ${admin?.name || "Admin"}: ${note}`;

    // Append to existing notes
    const existingNotes = ticket.admin_notes || "";
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${newNoteEntry}`
      : newNoteEntry;

    const updatedTicket = await prisma.ticket.update({
      where: { ticket_id },
      data: {
        admin_notes: updatedNotes,
        updated_at: new Date(),
      },
      include: {
        shop: {
          select: {
            shop_id: true,
            business_name: true,
          },
        },
        branch: {
          select: {
            branch_id: true,
            branch_name: true,
          },
        },
        created_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        cancelled_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        reopened_by: {
          select: {
            user_id: true,
            full_name: true,
            role: true,
          },
        },
        attachments: {
          select: {
            attachment_id: true,
            storage_key: true,
            original_name: true,
            mime_type: true,
            file_size: true,
          },
        },
      },
    });

    console.log(`✅ Admin note added to ticket ${ticket.ticket_number}`);

    return transformTicketForCAdmin(updatedTicket);
  } catch (error) {
    console.error("❌ addAdminNote error:", error);
    throw error;
  }
}
