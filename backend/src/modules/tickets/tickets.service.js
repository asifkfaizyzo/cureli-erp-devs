// backend/src/modules/tickets/tickets.service.js

import prisma from "../../config/prisma.js";
import fs from "fs";

// ============================================
// Generate Ticket Number
// ============================================
async function generateTicketNumber(shop_id) {
  const shopCode = shop_id.substring(0, 4).toUpperCase();
  const ticketCount = await prisma.ticket.count({ where: { shop_id } });
  const sequentialNumber = String(ticketCount + 1).padStart(5, "0");
  return `TKT-${shopCode}-${sequentialNumber}`;
}

// ============================================
// Transform Ticket Helper
// ============================================
function transformTicket(ticket) {
  return {
    ticket_id: ticket.ticket_id,
    ticket_number: ticket.ticket_number,
    shop_id: ticket.shop_id,
    branch_id: ticket.branch_id,
    branch_name: ticket.branch?.branch_name || null,

    created_by_user_id: ticket.created_by_user_id,
    created_by_name: ticket.created_by?.full_name || null,
    created_by_role: ticket.created_by?.role || null,

    contact_number: ticket.contact_number,
    category: ticket.category,
    other_category_text: ticket.other_category_text,
    subject: ticket.subject,
    description: ticket.description,
    preferred_slot: ticket.preferred_slot,

    status: ticket.status,
    admin_notes: ticket.admin_notes,

    cancelled_at: ticket.cancelled_at,
    cancelled_by_id: ticket.cancelled_by_id,
    cancelled_by_name: ticket.cancelled_by?.full_name || null,
    cancellation_reason: ticket.cancellation_reason,

    reopened_at: ticket.reopened_at,
    reopened_by_id: ticket.reopened_by_id,
    reopened_by_name: ticket.reopened_by?.full_name || null,
    reopen_count: ticket.reopen_count,
    reopen_reason: ticket.reopen_reason,

    attachments: ticket.attachments || [],
    attachment_count: ticket._count?.attachments || ticket.attachments?.length || 0,

    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

// ============================================
// Include Config
// ============================================
const ticketInclude = {
  branch: {
    select: { branch_id: true, branch_name: true },
  },
  created_by: {
    select: { user_id: true, full_name: true, role: true },
  },
  cancelled_by: {
    select: { user_id: true, full_name: true, role: true },
  },
  reopened_by: {
    select: { user_id: true, full_name: true, role: true },
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
};

// ============================================
// Create Ticket
// ============================================
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
  files = [],
}) {
  console.log("=== CREATE TICKET DEBUG ===");
  console.log("shop_id:", shop_id);
  console.log("branch_id:", branch_id);
  console.log("user_id:", user_id);
  console.log("category:", category);
  console.log("files count:", files.length);

  if (branch_id) {
    const branch = await prisma.branch.findFirst({
      where: { branch_id, shop_id, is_active: true },
    });

    if (!branch) {
      const err = new Error("Branch not found or inactive");
      err.code = "INVALID_BRANCH";
      throw err;
    }
  }

  const ticket_number = await generateTicketNumber(shop_id);
  console.log("Generated ticket_number:", ticket_number);

  try {
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          ticket_number,
          shop_id,
          branch_id: branch_id || null,
          created_by_user_id: user_id,
          contact_number,
          category, // Prisma should accept string for enum
          subject,
          description: description || null,
          other_category_text: category === "OTHER" ? other_category_text : null,
          preferred_slot,
          status: "PENDING", // Prisma should accept string for enum
        },
      });

      console.log("Created ticket:", newTicket.ticket_id);

      if (files.length > 0) {
        const attachmentData = files.map((file) => ({
          ticket_id: newTicket.ticket_id,
          storage_key: `tickets/${file.filename}`,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
        }));

        await tx.ticketAttachment.createMany({ data: attachmentData });
        console.log("Created attachments:", attachmentData.length);
      }

      return newTicket;
    });

    const completeTicket = await prisma.ticket.findUnique({
      where: { ticket_id: ticket.ticket_id },
      include: ticketInclude,
    });

    return transformTicket(completeTicket);
  } catch (error) {
    console.error("=== CREATE TICKET ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    
    // Prisma-specific error details
    if (error.meta) {
      console.error("Prisma meta:", error.meta);
    }

    if (files.length > 0) {
      files.forEach((file) => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    throw error;
  }
}

// ============================================
// Get Tickets
// ============================================
export async function getTickets({
  shop_id,
  branch_id,
  status,
  category,
  search,
  date_from,
  date_to,
  page = 1,
  limit = 20,
  sort_by = "created_at",
  sort_order = "desc",
  requester_role,
  requester_branch_id,
}) {
  console.log("=== GET TICKETS SERVICE DEBUG ===");
  console.log("Input params:", {
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

  const andConditions = [];

  // Always filter by shop
  andConditions.push({ shop_id });

  // Role-based filtering
  if (requester_role === "super_admin") {
    if (branch_id) {
      andConditions.push({ branch_id });
    }
  } else if (requester_role === "branch_admin") {
    if (requester_branch_id) {
      andConditions.push({
        OR: [
          { branch_id: requester_branch_id },
          { branch_id: null },
        ],
      });
    }
  }

  // Status filter
  if (status) {
    andConditions.push({ status });
  }

  // Category filter
  if (category) {
    andConditions.push({ category });
  }

  // Date range filter
  if (date_from || date_to) {
    const dateCondition = {};
    if (date_from) {
      dateCondition.gte = new Date(date_from);
    }
    if (date_to) {
      const endDate = new Date(date_to);
      endDate.setDate(endDate.getDate() + 1);
      dateCondition.lt = endDate;
    }
    andConditions.push({ created_at: dateCondition });
  }

  // Search filter
  if (search) {
    andConditions.push({
      OR: [
        { ticket_number: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  console.log("Final where clause:", JSON.stringify(where, null, 2));

  try {
    // ✅ Parse page and limit to ensure they're numbers
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    console.log("Pagination - page:", pageNum, "limit:", limitNum);

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: {
          ...ticketInclude,
          _count: { select: { attachments: true } },
        },
        orderBy: { [sort_by]: sort_order },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    console.log("Query result - total:", total, "fetched:", tickets.length);

    return {
      tickets: tickets.map(transformTicket),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    };
  } catch (error) {
    console.error("=== GET TICKETS ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    
    if (error.meta) {
      console.error("Prisma meta:", error.meta);
    }
    
    throw error;
  }
}

// ============================================
// Get Ticket By ID
// ============================================
export async function getTicketById(ticket_id, shop_id) {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { ticket_id, shop_id },
      include: ticketInclude,
    });

    return ticket ? transformTicket(ticket) : null;
  } catch (error) {
    console.error("getTicketById error:", error);
    throw error;
  }
}

// ============================================
// Cancel Ticket
// ============================================
export async function cancelTicket(ticket_id, shop_id, user_id, reason) {
  const ticket = await prisma.ticket.findFirst({
    where: { ticket_id, shop_id },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code = "TICKET_NOT_FOUND";
    throw err;
  }

  if (ticket.status === "CANCELLED") {
    const err = new Error("Ticket is already cancelled");
    err.code = "ALREADY_CANCELLED";
    throw err;
  }

  if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
    const err = new Error(`Cannot cancel a ${ticket.status.toLowerCase()} ticket`);
    err.code = "INVALID_STATUS_TRANSITION";
    throw err;
  }

  const updatedTicket = await prisma.ticket.update({
    where: { ticket_id },
    data: {
      status: "CANCELLED",
      cancelled_at: new Date(),
      cancelled_by_id: user_id,
      cancellation_reason: reason,
    },
    include: ticketInclude,
  });

  return transformTicket(updatedTicket);
}

// ============================================
// Reopen Ticket
// ============================================
export async function reopenTicket(ticket_id, shop_id, user_id, reason) {
  const ticket = await prisma.ticket.findFirst({
    where: { ticket_id, shop_id },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code = "TICKET_NOT_FOUND";
    throw err;
  }

  if (ticket.status === "CANCELLED") {
    const err = new Error("Cannot reopen a cancelled ticket");
    err.code = "CANNOT_REOPEN_CANCELLED";
    throw err;
  }

  if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
    const err = new Error("Only resolved or closed tickets can be reopened");
    err.code = "INVALID_STATUS_FOR_REOPEN";
    throw err;
  }

  const updatedTicket = await prisma.ticket.update({
    where: { ticket_id },
    data: {
      status: "PENDING",
      reopened_at: new Date(),
      reopened_by_id: user_id,
      reopen_count: { increment: 1 },
      reopen_reason: reason,
    },
    include: ticketInclude,
  });

  return transformTicket(updatedTicket);
}

// ============================================
// Get Ticket Stats
// ============================================
export async function getTicketStats(shop_id, requester_role, requester_branch_id) {
  const andConditions = [{ shop_id }];

  if (requester_role === "branch_admin" && requester_branch_id) {
    andConditions.push({
      OR: [
        { branch_id: requester_branch_id },
        { branch_id: null },
      ],
    });
  }

  const where = { AND: andConditions };

  try {
    const [statusCounts, categoryCounts, totalCount, recentCount] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      prisma.ticket.groupBy({
        by: ["category"],
        where,
        _count: { category: true },
      }),
      prisma.ticket.count({ where }),
      prisma.ticket.count({
        where: {
          AND: [
            ...andConditions,
            { created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
      }),
    ]);

    const byStatus = {
      PENDING: 0,
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
  } catch (error) {
    console.error("getTicketStats error:", error);
    throw error;
  }
}

// ============================================
// Check Access
// ============================================
export async function canAccessTicket(ticket_id, shop_id, requester_role, requester_branch_id) {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { ticket_id, shop_id },
      select: { branch_id: true },
    });

    if (!ticket) return false;
    if (requester_role === "super_admin") return true;

    return ticket.branch_id === requester_branch_id || ticket.branch_id === null;
  } catch (error) {
    console.error("canAccessTicket error:", error);
    return false;
  }
}