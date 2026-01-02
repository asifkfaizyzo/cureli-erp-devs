import prisma from "../../config/prisma.js";
import { sendMail } from "../../utils/email.js";

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
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
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
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { enquiry_number: { contains: search, mode: "insensitive" } },
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

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #000060, #1a1a8f); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
        .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #000060; }
        .footer { background: #333; color: #aaa; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
        .reference { color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Cureli ERP</h1>
          <p style="margin: 10px 0 0;">Response to Your Enquiry</p>
        </div>
        <div class="content">
          <p>Dear <strong>${enquiry.name}</strong>,</p>
          <p>Thank you for reaching out to us. Here is our response to your enquiry:</p>
          
          <div class="message-box">
            <h3 style="margin-top: 0; color: #000060;">${data.subject}</h3>
            <div style="white-space: pre-wrap;">${data.message}</div>
          </div>
          
          <p class="reference">Reference: <strong>${enquiry.enquiry_number}</strong></p>
          
          <p>If you have any further questions, please don't hesitate to reply to this email.</p>
          
          <p>Best regards,<br><strong>Cureli ERP Support Team</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
          <p>This is an automated response to your enquiry.</p>
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
        subject: data.subject,
        message: data.message,
        email_sent: emailSent,
        email_sent_at: emailSent ? new Date() : null,
        email_error: emailError,
      },
      include: {
        replied_by: {
          select: { cadmin_id: true, name: true, username: true },
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

  await prisma.enquiry.delete({
    where: { enquiry_id: enquiryId },
  });

  return enquiry;
};