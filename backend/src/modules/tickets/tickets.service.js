// src/modules/tickets/tickets.service.js

import prisma from "../../config/prisma.js";

/**
 * ============================================
 * GENERATE TICKET NUMBER
 * ============================================
 * Format: TKT-SHOPCODE-00001
 * SHOPCODE = first 4 chars of shop_id (uppercase)
 */
async function generateTicketNumber(shop_id) {
  // Get shop code from shop_id (first 4 characters)
  const shopCode = shop_id.substring(0, 4).toUpperCase();

  // Get the count of existing tickets for this shop
  const ticketCount = await prisma.ticket.count({
    where: { shop_id },
  });

  // Generate sequential number (padded to 5 digits)
  const sequentialNumber = String(ticketCount + 1).padStart(5, "0");

  return `TKT-${shopCode}-${sequentialNumber}`;
}

/**
 * ============================================
 * CREATE TICKET
 * ============================================
 */
export async function createTicket({
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
}) {
  // Validate branch belongs to shop
  const branch = await prisma.branch.findFirst({
    where: {
      branch_id,
      shop_id,
      is_active: true,
    },
  });

  if (!branch) {
    const err = new Error("Branch not found or inactive");
    err.code = "INVALID_BRANCH";
    throw err;
  }

  // Generate ticket number
  const ticket_number = await generateTicketNumber(shop_id);

  // Create ticket with optional attachments
  const ticket = await prisma.ticket.create({
    data: {
      ticket_number,
      shop_id,
      branch_id,
      created_by_user_id: user_id,
      contact_number,
      category,
      subject,
      description,
      other_category_text: category === "OTHER" ? other_category_text : null,
      preferred_slot,
      status: "OPEN",
      // Connect attachments if provided
      ...(attachment_ids && attachment_ids.length > 0
        ? {
            attachments: {
              connect: attachment_ids.map((id) => ({ attachment_id: id })),
            },
          }
        : {}),
    },
    include: {
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
      attachments: {
        select: {
          attachment_id: true,
          original_name: true,
          mime_type: true,
          file_size: true,
        },
      },
    },
  });

  return transformTicket(ticket);
}

/**
 * ============================================
 * GET TICKETS (with filtering & pagination)
 * ============================================
 */
export async function getTickets({
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
}) {
  // Build where clause
  const where = { shop_id };

  // Branch filtering based on role
  if (requester_role === "super_admin") {
    // SA can filter by any branch or see all
    if (branch_id) {
      where.branch_id = branch_id;
    }
  } else {
    // BA can only see their own branch tickets
    where.branch_id = requester_branch_id;
  }

  // Status filter
  if (status) {
    where.status = status;
  }

  // Category filter
  if (category) {
    where.category = category;
  }

  // Date range filter
  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) {
      where.created_at.gte = new Date(date_from);
    }
    if (date_to) {
      // Add 1 day to include the entire end date
      const endDate = new Date(date_to);
      endDate.setDate(endDate.getDate() + 1);
      where.created_at.lt = endDate;
    }
  }

  // Search filter (ticket number, subject)
  if (search) {
    where.OR = [
      { ticket_number: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  // Get total count
  const total = await prisma.ticket.count({ where });

  // Get paginated results
  const tickets = await prisma.ticket.findMany({
    where,
    include: {
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
      attachments: {
        select: {
          attachment_id: true,
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
    orderBy: { [sort_by]: sort_order },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    tickets: tickets.map(transformTicket),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * ============================================
 * GET SINGLE TICKET BY ID
 * ============================================
 */
export async function getTicketById(ticket_id, shop_id) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      ticket_id,
      shop_id,
    },
    include: {
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

  return transformTicket(ticket);
}

/**
 * ============================================
 * GET TICKET BY TICKET NUMBER
 * ============================================
 */
export async function getTicketByNumber(ticket_number, shop_id) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      ticket_number,
      shop_id,
    },
    include: {
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
      attachments: {
        select: {
          attachment_id: true,
          original_name: true,
          mime_type: true,
          file_size: true,
        },
      },
    },
  });

  if (!ticket) return null;

  return transformTicket(ticket);
}

/**
 * ============================================
 * CANCEL TICKET
 * ============================================
 */
export async function cancelTicket(ticket_id, shop_id, user_id, reason) {
  // Get ticket
  const ticket = await prisma.ticket.findFirst({
    where: {
      ticket_id,
      shop_id,
    },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code = "TICKET_NOT_FOUND";
    throw err;
  }

  // Check if already cancelled
  if (ticket.status === "CANCELLED") {
    const err = new Error("Ticket is already cancelled");
    err.code = "ALREADY_CANCELLED";
    throw err;
  }

  // Check if closed/resolved (can't cancel)
  if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
    const err = new Error(`Cannot cancel a ${ticket.status.toLowerCase()} ticket`);
    err.code = "INVALID_STATUS_TRANSITION";
    throw err;
  }

  // Cancel the ticket
  const updatedTicket = await prisma.ticket.update({
    where: { ticket_id },
    data: {
      status: "CANCELLED",
      cancelled_at: new Date(),
      cancelled_by_id: user_id,
      cancellation_reason: reason,
    },
    include: {
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
    },
  });

  return transformTicket(updatedTicket);
}

/**
 * ============================================
 * REOPEN TICKET
 * ============================================
 */
export async function reopenTicket(ticket_id, shop_id, user_id, reason) {
  // Get ticket
  const ticket = await prisma.ticket.findFirst({
    where: {
      ticket_id,
      shop_id,
    },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code = "TICKET_NOT_FOUND";
    throw err;
  }

  // Check if ticket is cancelled
  if (ticket.status !== "CANCELLED") {
    const err = new Error("Only cancelled tickets can be reopened");
    err.code = "INVALID_STATUS_TRANSITION";
    throw err;
  }

  // Reopen the ticket
  const updatedTicket = await prisma.ticket.update({
    where: { ticket_id },
    data: {
      status: "OPEN",
      reopened_at: new Date(),
      reopened_by_id: user_id,
      reopen_count: { increment: 1 },
      // Clear cancellation details
      cancelled_at: null,
      cancelled_by_id: null,
      cancellation_reason: null,
    },
    include: {
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
      reopened_by: {
        select: {
          user_id: true,
          full_name: true,
          role: true,
        },
      },
    },
  });

  return transformTicket(updatedTicket);
}

/**
 * ============================================
 * GET TICKET STATS
 * ============================================
 */
export async function getTicketStats(shop_id, requester_role, requester_branch_id) {
  const where = { shop_id };

  // BA can only see their branch stats
  if (requester_role !== "super_admin") {
    where.branch_id = requester_branch_id;
  }

  // Get counts by status
  const statusCounts = await prisma.ticket.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });

  // Get total count
  const totalCount = await prisma.ticket.count({ where });

  // Get counts by category
  const categoryCounts = await prisma.ticket.groupBy({
    by: ["category"],
    where,
    _count: { category: true },
  });

  // Get recent tickets count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentCount = await prisma.ticket.count({
    where: {
      ...where,
      created_at: { gte: sevenDaysAgo },
    },
  });

  // Transform to object
  const byStatus = {
    OPEN: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CANCELLED: 0,
    CLOSED: 0,
  };

  statusCounts.forEach((item) => {
    byStatus[item.status] = item._count.status;
  });

  const byCategory = {
    TECHNICAL_ISSUE: 0,
    BILLING_ISSUE: 0,
    FEATURE_REQUEST: 0,
    ACCOUNT_ISSUE: 0,
    OTHER: 0,
  };

  categoryCounts.forEach((item) => {
    byCategory[item.category] = item._count.category;
  });

  return {
    total: totalCount,
    recent_7_days: recentCount,
    by_status: byStatus,
    by_category: byCategory,
  };
}

/**
 * ============================================
 * CHECK USER CAN ACCESS TICKET
 * ============================================
 */
export async function canAccessTicket(ticket_id, shop_id, requester_role, requester_branch_id) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      ticket_id,
      shop_id,
    },
    select: {
      branch_id: true,
    },
  });

  if (!ticket) return false;

  // Super Admin can access all
  if (requester_role === "super_admin") return true;

  // Branch Admin can only access their branch tickets
  return ticket.branch_id === requester_branch_id;
}

/**
 * ============================================
 * HELPER: Transform ticket for response
 * ============================================
 */
function transformTicket(ticket) {
  return {
    ticket_id: ticket.ticket_id,
    ticket_number: ticket.ticket_number,
    shop_id: ticket.shop_id,
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
    attachment_count: ticket._count?.attachments || ticket.attachments?.length || 0,
    
    // Timestamps
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}