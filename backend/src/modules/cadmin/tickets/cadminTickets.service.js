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

    // Rest of the code remains the same...
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
        attachments: true, // ✅ Include attachments
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
            business_name: true, // ✅ FIXED: Changed from shop_name
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
            uploaded_at: true,
          },
        },
      },
    });

    if (!ticket) return null;

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
export async function updateTicketStatus({
  ticket_id,
  status,
  admin_notes,
  cadmin_id,
}) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
    });

    if (!ticket) return null;

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { ticket_id },
      data: {
        status,
        admin_notes: admin_notes || ticket.admin_notes,
        updated_at: new Date(),
      },
      include: {
        shop: {
          select: {
            shop_id: true,
            business_name: true, // ✅ FIXED: Changed from shop_name
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
      },
    });

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
export async function addAdminNote({ ticket_id, note, cadmin_id }) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticket_id },
    });

    if (!ticket) return null;

    const existingNotes = ticket.admin_notes || "";
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] Admin: ${note}`;
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n${newNote}`
      : newNote;

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
            business_name: true, // ✅ FIXED: Changed from shop_name
          },
        },
        branch: true,
        created_by: true,
      },
    });

    return transformTicketForCAdmin(updatedTicket);
  } catch (error) {
    console.error("❌ addAdminNote error:", error);
    throw error;
  }
}

/**
 * ============================================
 * GET TICKET STATS (All Shops)
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

    // Shop & Branch - ✅ FIXED: Use business_name instead of shop_name
    shop_id: ticket.shop_id,
    shop_name: ticket.shop?.business_name || null, // Map business_name to shop_name for API response
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

    // Status
    status: ticket.status,
    admin_notes: ticket.admin_notes,

    // Cancellation
    cancelled_at: ticket.cancelled_at,
    cancelled_by_id: ticket.cancelled_by_id,
    cancelled_by_name: ticket.cancelled_by?.full_name || null,
    cancellation_reason: ticket.cancellation_reason,

    // Reopening
    reopened_at: ticket.reopened_at,
    reopened_by_id: ticket.reopened_by_id,
    reopened_by_name: ticket.reopened_by?.full_name || null,
    reopen_count: ticket.reopen_count,

    // Attachments
    attachments: ticket.attachments || [],
    attachment_count: ticket.attachments?.length || 0,

    // Timestamps
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}
