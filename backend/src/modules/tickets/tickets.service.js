// backend/src/modules/tickets/tickets.service.js

import prisma from "../../config/prisma.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// Multer Configuration for Ticket Attachments
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../../uploads/tickets");
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, uniqueSuffix + "-" + sanitizedName + ext);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and PDFs are allowed."));
  }
};

export const uploadTicketAttachments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 3, // Max 3 files
  },
});

/**
 * ============================================
 * GENERATE TICKET NUMBER
 * ============================================
 */
async function generateTicketNumber(shop_id) {
  const shopCode = shop_id.substring(0, 4).toUpperCase();
  const ticketCount = await prisma.ticket.count({
    where: { shop_id },
  });
  const sequentialNumber = String(ticketCount + 1).padStart(5, "0");
  return `TKT-${shopCode}-${sequentialNumber}`;
}

/**
 * ============================================
 * CREATE TICKET (with file attachments)
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
  files,
}) {
  try {
    if (branch_id) {
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
    }

    const ticket_number = await generateTicketNumber(shop_id);

    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          ticket_number,
          shop_id,
          branch_id: branch_id || null,
          created_by_user_id: user_id,
          contact_number,
          category,
          subject,
          description,
          other_category_text: category === "OTHER" ? other_category_text : null,
          preferred_slot,
          status: "PENDING",
        },
      });

      if (files && files.length > 0) {
        const attachmentData = files.map((file) => ({
          ticket_id: newTicket.ticket_id,
          storage_key: `tickets/${file.filename}`,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
        }));

        await tx.ticketAttachment.createMany({
          data: attachmentData,
        });

        console.log(`✅ Created ${attachmentData.length} attachments for ticket ${ticket_number}`);
      }

      return newTicket;
    });

    const completeTicket = await prisma.ticket.findUnique({
      where: { ticket_id: ticket.ticket_id },
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
            storage_key: true,
            original_name: true,
            mime_type: true,
            file_size: true,
            uploaded_at: true,
          },
        },
      },
    });

    return transformTicket(completeTicket);
  } catch (error) {
    console.error("❌ createTicket error:", error);
    
    if (files && files.length > 0) {
      files.forEach((file) => {
        const filePath = file.path;
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`🗑️ Cleaned up file: ${file.filename}`);
        }
      });
    }
    
    throw error;
  }
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
  const where = { shop_id };

  if (requester_role === "super_admin") {
    if (branch_id) {
      where.branch_id = branch_id;
    }
  } else if (requester_role === "branch_admin") {
    where.OR = [
      { branch_id: requester_branch_id },
      { branch_id: null },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

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

  if (search) {
    where.OR = [
      { ticket_number: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  const total = await prisma.ticket.count({ where });

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
      reopened_by: { // ✅ CRITICAL: Include this
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

  // ✅ Debug log (remove after fixing)
  console.log("🔍 Fetched ticket:", {
    ticket_id: ticket.ticket_id,
    reopened_by_id: ticket.reopened_by_id,
    reopened_by: ticket.reopened_by,
  });

  return transformTicket(ticket);
}

/**
 * ============================================
 * CANCEL TICKET
 * ============================================
 */
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
    include: {
      branch: { select: { branch_id: true, branch_name: true } },
      created_by: { select: { user_id: true, full_name: true, role: true } },
      cancelled_by: { select: { user_id: true, full_name: true, role: true } },
      reopened_by: { select: { user_id: true, full_name: true, role: true } }, // ✅ ADDED
      attachments: true,
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
  const ticket = await prisma.ticket.findFirst({
    where: { ticket_id, shop_id },
  });

  if (!ticket) {
    const err = new Error("Ticket not found");
    err.code = "TICKET_NOT_FOUND";
    throw err;
  }

  if (ticket.status !== "RESOLVED" && ticket.status !== "CLOSED") {
    const err = new Error("Only resolved or closed tickets can be reopened");
    err.code = "INVALID_STATUS_FOR_REOPEN";
    throw err;
  }

  if (ticket.status === "CANCELLED") {
    const err = new Error("Cannot reopen a cancelled ticket");
    err.code = "CANNOT_REOPEN_CANCELLED";
    throw err;
  }

  const updatedTicket = await prisma.ticket.update({
    where: { ticket_id },
    data: {
      status: "PENDING",
      reopened_at: new Date(),
      reopened_by_id: user_id,
      reopen_count: ticket.reopen_count + 1,
      reopen_reason: reason,
    },
    include: {
      branch: { select: { branch_id: true, branch_name: true } },
      created_by: { select: { user_id: true, full_name: true, role: true } },
      cancelled_by: { select: { user_id: true, full_name: true, role: true } },
      reopened_by: { select: { user_id: true, full_name: true, role: true } }, // ✅ CRITICAL
      attachments: true,
    },
  });

  // ✅ Debug log (remove after fixing)
  console.log("🔍 Reopened ticket:", {
    ticket_id: updatedTicket.ticket_id,
    reopened_by_id: updatedTicket.reopened_by_id,
    reopened_by: updatedTicket.reopened_by,
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

  if (requester_role === "branch_admin") {
    where.OR = [
      { branch_id: requester_branch_id },
      { branch_id: null },
    ];
  }

  const statusCounts = await prisma.ticket.groupBy({
    by: ["status"],
    where,
    _count: { status: true },
  });

  const totalCount = await prisma.ticket.count({ where });

  const categoryCounts = await prisma.ticket.groupBy({
    by: ["category"],
    where,
    _count: { category: true },
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentCount = await prisma.ticket.count({
    where: { ...where, created_at: { gte: sevenDaysAgo } },
  });

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
    
    // Status & Admin Notes
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
    reopened_by_name: ticket.reopened_by?.full_name || null, // ✅ Should work now
    reopen_count: ticket.reopen_count,
    reopen_reason: ticket.reopen_reason,
    
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

  if (requester_role === "super_admin") return true;

  return ticket.branch_id === requester_branch_id || ticket.branch_id === null;
}
