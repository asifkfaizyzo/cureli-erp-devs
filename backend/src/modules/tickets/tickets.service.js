// backend/src/modules/tickets/tickets.service.js

import prisma from "../../config/prisma.js";
import fs from "fs";
import { notifyAsync } from "../notifications/index.js";  // ✅ ADD THIS
import { NOTIFICATION_EVENTS } from "../notifications/notification.events.js";  // ✅ ADD THIS

// ============================================
// CONSTANTS
// ============================================
const REOPEN_LIMIT = 6;
const MAX_RETRY_ATTEMPTS = 3;

// ============================================
// STATUS TRANSITION MATRIX
// Defines valid status transitions
// ============================================
const STATUS_TRANSITIONS = {
  PENDING: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "PENDING"], // PENDING via reopen
  CLOSED: ["PENDING"], // PENDING via reopen
  CANCELLED: [], // Terminal state - no transitions allowed
};

/**
 * Validate if a status transition is allowed
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean}
 */
function isValidTransition(fromStatus, toStatus) {
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
  return allowedTransitions ? allowedTransitions.includes(toStatus) : false;
}

// ============================================
// UTILITY: Mask sensitive data for logs
// ============================================
function maskPhone(phone) {
  if (!phone || phone.length < 7) return "***";
  return phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");
}

function maskUserId(userId) {
  if (!userId) return "***";
  return userId.substring(0, 8) + "...";
}

function sanitizeLogData(data) {
  const sanitized = { ...data };
  if (sanitized.contact_number) {
    sanitized.contact_number = maskPhone(sanitized.contact_number);
  }
  if (sanitized.user_id) {
    sanitized.user_id = maskUserId(sanitized.user_id);
  }
  if (sanitized.shop_id) {
    sanitized.shop_id = maskUserId(sanitized.shop_id);
  }
  return sanitized;
}

// ============================================
// Generate Ticket Number with Retry Logic
// Handles race conditions with unique constraint
// ============================================
async function generateTicketNumber(shop_id, tx, attempt = 1) {
  const shopCode = shop_id.substring(0, 4).toUpperCase();

  // Use a more robust approach: get the highest ticket number and increment
  const lastTicket = await tx.ticket.findFirst({
    where: { shop_id },
    orderBy: { created_at: "desc" },
    select: { ticket_number: true },
  });

  let sequentialNumber;

  if (lastTicket && lastTicket.ticket_number) {
    // Extract the number from the last ticket (format: TKT-XXXX-00001)
    const parts = lastTicket.ticket_number.split("-");
    const lastNumber = parseInt(parts[2], 10) || 0;
    sequentialNumber = String(lastNumber + attempt).padStart(5, "0");
  } else {
    sequentialNumber = String(attempt).padStart(5, "0");
  }

  const ticketNumber = `TKT-${shopCode}-${sequentialNumber}`;

  // Verify uniqueness
  const existing = await tx.ticket.findUnique({
    where: { ticket_number: ticketNumber },
    select: { ticket_id: true },
  });

  if (existing) {
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      // Fallback: Use timestamp-based suffix
      const timestamp = Date.now().toString(36).toUpperCase();
      return `TKT-${shopCode}-${timestamp}`;
    }
    // Retry with incremented number
    return generateTicketNumber(shop_id, tx, attempt + 1);
  }

  return ticketNumber;
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
    attachment_count:
      ticket._count?.attachments || ticket.attachments?.length || 0,

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
    select: { 
      user_id: true, 
      full_name: true, 
      role: true,
      email: true  // ✅ ADD THIS LINE
    },
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
// Check for Duplicate Tickets (Rate Limiting)
// ============================================
async function checkDuplicateTicket(shop_id, user_id, subject) {
  const ONE_MINUTE_AGO = new Date(Date.now() - 60 * 1000);

  const recentTicket = await prisma.ticket.findFirst({
    where: {
      shop_id,
      created_by_user_id: user_id,
      created_at: { gte: ONE_MINUTE_AGO },
    },
    select: { ticket_id: true, subject: true },
  });

  if (recentTicket) {
    const err = new Error(
      "Please wait before creating another ticket. You can only create one ticket per minute."
    );
    err.code = "RATE_LIMIT_EXCEEDED";
    throw err;
  }

  // Check for duplicate subject in last 5 minutes
  const FIVE_MINUTES_AGO = new Date(Date.now() - 5 * 60 * 1000);
  const duplicateSubject = await prisma.ticket.findFirst({
    where: {
      shop_id,
      created_by_user_id: user_id,
      subject: subject.trim(),
      created_at: { gte: FIVE_MINUTES_AGO },
    },
    select: { ticket_id: true },
  });

  if (duplicateSubject) {
    const err = new Error(
      "A ticket with the same subject was recently created. Please check your existing tickets."
    );
    err.code = "DUPLICATE_TICKET";
    throw err;
  }
}

// ============================================
// Validate Branch Ownership
// ============================================
async function validateBranchOwnership(
  shop_id,
  branch_id,
  user_id,
  user_branch_id,
  role
) {
  // Super admins can create tickets for any branch
  if (role === "super_admin") {
    // Just validate the branch exists and belongs to the shop
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
    return;
  }

  // Branch admins can only create tickets for their own branch or shop-level (null branch)
  if (role === "branch_admin") {
    if (branch_id && branch_id !== user_branch_id) {
      const err = new Error("You can only create tickets for your own branch");
      err.code = "BRANCH_ACCESS_DENIED";
      throw err;
    }

    // Validate the branch exists
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
  }
}

// ============================================
// Create Ticket
// ============================================
export async function createTicket({
  shop_id,
  branch_id,
  user_id,
  user_branch_id,
  user_role,
  contact_number,
  category,
  subject,
  description,
  other_category_text,
  preferred_slot,
  files = [],
}) {
  // Sanitized logging
  console.log("=== CREATE TICKET ===");
  console.log(
    "Data:",
    sanitizeLogData({
      shop_id,
      branch_id,
      user_id,
      category,
      files_count: files.length,
    })
  );

  // 1. Check for duplicate/rate limiting
  await checkDuplicateTicket(shop_id, user_id, subject);

  // 2. Validate branch ownership
  await validateBranchOwnership(
    shop_id,
    branch_id,
    user_id,
    user_branch_id,
    user_role
  );

  try {
    const ticket = await prisma.$transaction(async (tx) => {
      // 3. Generate ticket number with retry logic
      const ticket_number = await generateTicketNumber(shop_id, tx);
      console.log("Generated ticket_number:", ticket_number);

      // 4. Create the ticket
      const newTicket = await tx.ticket.create({
        data: {
          ticket_number,
          shop_id,
          branch_id: branch_id || null,
          created_by_user_id: user_id,
          contact_number,
          category,
          subject: subject.trim(),
          description: description?.trim() || null,
          other_category_text:
            category === "OTHER" ? other_category_text?.trim() : null,
          preferred_slot,
          status: "PENDING",
        },
      });

      console.log("Created ticket:", newTicket.ticket_id);

      // 5. Create attachments
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

    // 6. Fetch complete ticket
    const completeTicket = await prisma.ticket.findUnique({
      where: { ticket_id: ticket.ticket_id },
      include: ticketInclude,
    });
    // ============================================
    // ✅ SEND TICKET CREATED EMAIL
    // ============================================
    if (completeTicket.created_by?.email) {
      notifyAsync({
        type: NOTIFICATION_EVENTS.TICKET_CREATED,
        context: {
          ticket_id: completeTicket.ticket_id,
          ticket_number: completeTicket.ticket_number,
          subject: completeTicket.subject,
          category: completeTicket.category,
          // Direct recipient info
          email: completeTicket.created_by.email,
          name: completeTicket.created_by.full_name || "Customer",
        },
      });
    } else {
      console.warn(
        `⚠️ No email for ticket ${completeTicket.ticket_number} creator`
      );
    }

    return transformTicket(completeTicket);
  } catch (error) {
    console.error("=== CREATE TICKET ERROR ===");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    // Clean up uploaded files on error
    if (files.length > 0) {
      files.forEach((file) => {
        if (file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error("Failed to cleanup file:", file.path);
          }
        }
      });
    }

    // Handle unique constraint violation (race condition fallback)
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("ticket_number")
    ) {
      const err = new Error(
        "Failed to generate unique ticket number. Please try again."
      );
      err.code = "TICKET_NUMBER_CONFLICT";
      throw err;
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
        OR: [{ branch_id: requester_branch_id }, { branch_id: null }],
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

  try {
    const pageNum = typeof page === "string" ? parseInt(page, 10) : page;
    const limitNum = typeof limit === "string" ? parseInt(limit, 10) : limit;

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
    console.error("getTickets error:", error.message);
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
    console.error("getTicketById error:", error.message);
    throw error;
  }
}

// ============================================
// Cancel Ticket (with transition validation)
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

  // Validate status transition
  if (!isValidTransition(ticket.status, "CANCELLED")) {
    if (ticket.status === "CANCELLED") {
      const err = new Error("Ticket is already cancelled");
      err.code = "ALREADY_CANCELLED";
      throw err;
    }
    const err = new Error(
      `Cannot cancel a ${ticket.status.toLowerCase()} ticket`
    );
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
// Reopen Ticket (with limit enforcement)
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

  // Check reopen limit (CRITICAL)
  if (ticket.reopen_count >= REOPEN_LIMIT) {
    const err = new Error(
      `This ticket has been reopened ${REOPEN_LIMIT} times. Please create a new ticket or contact support via email.`
    );
    err.code = "REOPEN_LIMIT_EXCEEDED";
    throw err;
  }

  // Validate status transition
  if (!isValidTransition(ticket.status, "PENDING")) {
    if (ticket.status === "CANCELLED") {
      const err = new Error("Cannot reopen a cancelled ticket");
      err.code = "CANNOT_REOPEN_CANCELLED";
      throw err;
    }
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

  console.log(
    `Ticket ${ticket.ticket_number} reopened. Count: ${updatedTicket.reopen_count}/${REOPEN_LIMIT}`
  );

  return transformTicket(updatedTicket);
}

// ============================================
// Get Ticket Stats
// ============================================
export async function getTicketStats(
  shop_id,
  requester_role,
  requester_branch_id
) {
  const andConditions = [{ shop_id }];

  if (requester_role === "branch_admin" && requester_branch_id) {
    andConditions.push({
      OR: [{ branch_id: requester_branch_id }, { branch_id: null }],
    });
  }

  const where = { AND: andConditions };

  try {
    const [statusCounts, categoryCounts, totalCount, recentCount] =
      await Promise.all([
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
              {
                created_at: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
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
    console.error("getTicketStats error:", error.message);
    throw error;
  }
}

// ============================================
// Check Access
// ============================================
export async function canAccessTicket(
  ticket_id,
  shop_id,
  requester_role,
  requester_branch_id
) {
  try {
    const ticket = await prisma.ticket.findFirst({
      where: { ticket_id, shop_id },
      select: { branch_id: true },
    });

    if (!ticket) return false;
    if (requester_role === "super_admin") return true;

    return (
      ticket.branch_id === requester_branch_id || ticket.branch_id === null
    );
  } catch (error) {
    console.error("canAccessTicket error:", error.message);
    return false;
  }
}

// ============================================
// EXPORTS: Status Transition Helpers (for testing/admin)
// ============================================
export { isValidTransition, STATUS_TRANSITIONS, REOPEN_LIMIT };
