// backend/src/modules/enquiries/enquiries.service.js
import prisma from "../../config/prisma.js";
import { sendMail } from "../../utils/email.js";

// HTML escape function for XSS prevention in emails
const escapeHtml = (text) => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Sanitize search input for LIKE patterns
const sanitizeSearchPattern = (search) => {
  if (!search) return search;
  return search.replace(/[%_\\]/g, "\\$&");
};

const generateEnquiryNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `ENQ-${dateStr}-`;

  const lastEnquiry = await prisma.enquiry.findFirst({
    where: { enquiry_number: { startsWith: prefix } },
    orderBy: { enquiry_number: "desc" },
  });

  let sequence = 1;
  if (lastEnquiry) {
    const lastSequence = parseInt(lastEnquiry.enquiry_number.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
};

export const createEnquiry = async (data) => {
  const enquiryNumber = await generateEnquiryNumber();

  const enquiry = await prisma.enquiry.create({
    data: {
      enquiry_number: enquiryNumber,
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      message: data.message.trim(),
      status: "PENDING",
    },
  });

  return enquiry;
};

export const listEnquiries = async (options) => {
  const { page, limit, status, search, sortBy, sortOrder } = options;
  const skip = (page - 1) * limit;

  const where = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search) {
    const sanitizedSearch = sanitizeSearchPattern(search.trim());
    where.OR = [
      { name: { contains: sanitizedSearch, mode: "insensitive" } },
      { email: { contains: sanitizedSearch, mode: "insensitive" } },
      { enquiry_number: { contains: sanitizedSearch, mode: "insensitive" } },
    ];
  }

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        replies: {
          select: { reply_id: true, created_at: true },
          orderBy: { created_at: "desc" },
        },
        _count: { select: { replies: true } },
      },
    }),
    prisma.enquiry.count({ where }),
  ]);

  const enquiriesWithCount = enquiries.map((e) => ({
    enquiry_id: e.enquiry_id,
    enquiry_number: e.enquiry_number,
    name: e.name,
    email: e.email,
    phone: e.phone,
    message: e.message,
    status: e.status,
    created_at: e.created_at,
    updated_at: e.updated_at,
    reply_count: e._count.replies,
    last_replied_at: e.replies[0]?.created_at || null,
  }));

  return {
    enquiries: enquiriesWithCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEnquiryById = async (enquiryId) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
    include: {
      replies: {
        include: {
          replied_by: {
            select: { cadmin_id: true, name: true, username: true },
          },
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  return enquiry;
};

export const replyToEnquiry = async (enquiryId, adminId, data) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
  });

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  // Get admin details for the email signature
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: adminId },
    select: { name: true, email: true },
  });

  const adminName = admin?.name || "Support Team";
  const adminEmail = admin?.email || process.env.MAIL_USER || "support@cureli.com";

  // Escape HTML to prevent XSS in emails
  const escapedName = escapeHtml(enquiry.name);
  const escapedSubject = escapeHtml(data.subject);
  const escapedMessage = escapeHtml(data.message);
  const escapedAdminName = escapeHtml(adminName);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background: linear-gradient(135deg, #000060, #1a1a8f); 
          color: white; 
          padding: 30px; 
          text-align: center; 
          border-radius: 10px 10px 0 0; 
        }
        .content { 
          background: #f9f9f9; 
          padding: 30px; 
          border: 1px solid #e0e0e0; 
        }
        .message-box { 
          background: white; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 20px 0; 
          border-left: 4px solid #000060; 
        }
        .footer { 
          background: #333; 
          color: #aaa; 
          padding: 20px; 
          text-align: center; 
          font-size: 12px; 
          border-radius: 0 0 10px 10px; 
        }
        .reference { 
          color: #666; 
          font-size: 14px; 
        }
        .signature {
          margin-top: 25px;
          padding-top: 15px;
          border-top: 1px solid #e0e0e0;
        }
        .signature-name {
          color: #000060;
          font-weight: 600;
        }
        .signature-email {
          color: #666;
          font-size: 13px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Cureli ERP</h1>
          <p style="margin: 10px 0 0;">Response to Your Enquiry</p>
        </div>
        <div class="content">
          <p>Dear <strong>${escapedName}</strong>,</p>
          <p>Thank you for reaching out to us. Here is our response to your enquiry:</p>
          
          <div class="message-box">
            <h3 style="margin-top: 0; color: #000060;">${escapedSubject}</h3>
            <div style="white-space: pre-wrap;">${escapedMessage}</div>
          </div>
          
          <p class="reference">Reference: <strong>${enquiry.enquiry_number}</strong></p>
          
          <p>If you have any further questions, please don't hesitate to reply to this email.</p>
          
          <div class="signature">
            <p style="margin: 0;">Best regards,</p>
            <p class="signature-name" style="margin: 5px 0 0;">${escapedAdminName}</p>
            <p class="signature-email" style="margin: 2px 0 0;">${adminEmail}</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Cureli ERP Support Team</p>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
          <p>Response sent by ${escapedAdminName}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  let emailSent = false;
  let emailError = null;

  try {
    await sendMail(enquiry.email, data.subject, emailHtml);
    emailSent = true;
  } catch (err) {
    emailError = err.message;
    console.error("Failed to send email:", err);
  }

  const reply = await prisma.$transaction(async (tx) => {
    const newReply = await tx.enquiryReply.create({
      data: {
        enquiry_id: enquiryId,
        replied_by_id: adminId,
        subject: data.subject.trim(),
        message: data.message.trim(),
        email_sent: emailSent,
        email_sent_at: emailSent ? new Date() : null,
        email_error: emailError,
      },
      include: {
        replied_by: {
          select: { cadmin_id: true, name: true, username: true, email: true },
        },
      },
    });

    await tx.enquiry.update({
      where: { enquiry_id: enquiryId },
      data: { status: "REPLIED" },
    });

    return newReply;
  });

  return { reply, emailSent, emailError };
};

export const updateEnquiryStatus = async (enquiryId, status) => {
  const existingEnquiry = await prisma.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
  });

  if (!existingEnquiry) {
    throw new Error("Enquiry not found");
  }

  const enquiry = await prisma.enquiry.update({
    where: { enquiry_id: enquiryId },
    data: { status },
  });

  return enquiry;
};

export const getEnquiryStats = async () => {
  const [pending, inProgress, replied, closed, total] = await Promise.all([
    prisma.enquiry.count({ where: { status: "PENDING" } }),
    prisma.enquiry.count({ where: { status: "IN_PROGRESS" } }),
    prisma.enquiry.count({ where: { status: "REPLIED" } }),
    prisma.enquiry.count({ where: { status: "CLOSED" } }),
    prisma.enquiry.count(),
  ]);

  return { pending, inProgress, replied, closed, total };
};

export const deleteEnquiry = async (enquiryId) => {
  const enquiry = await prisma.enquiry.findUnique({
    where: { enquiry_id: enquiryId },
  });

  if (!enquiry) {
    throw new Error("Enquiry not found");
  }

  // Delete replies first (if not using cascade delete)
  await prisma.enquiryReply.deleteMany({
    where: { enquiry_id: enquiryId },
  });

  await prisma.enquiry.delete({
    where: { enquiry_id: enquiryId },
  });

  return enquiry;
};