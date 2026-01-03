// backend/src/utils/ticketEmails.js

import { sendMail } from "./email.js";

/**
 * ============================================
 * TICKET EMAIL TEMPLATES & SENDER
 * ============================================
 */

// Status display configuration
const STATUS_DISPLAY = {
  PENDING: {
    label: "Pending",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    message: "Your ticket is awaiting review by our support team.",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    message: "Our support team is actively working on your ticket.",
  },
  RESOLVED: {
    label: "Resolved",
    color: "#10b981",
    bgColor: "#d1fae5",
    message: "Your issue has been resolved. If you're still experiencing problems, you can reopen this ticket.",
  },
  CLOSED: {
    label: "Closed",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    message: "This ticket has been closed. Thank you for contacting support.",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#ef4444",
    bgColor: "#fee2e2",
    message: "This ticket has been cancelled.",
  },
};

/**
 * Generate HTML email template for ticket status update
 */
function generateTicketStatusEmailHtml({
  userName,
  ticketNumber,
  subject,
  fromStatus,
  toStatus,
  adminNote,
  ticketUrl,
}) {
  const toStatusConfig = STATUS_DISPLAY[toStatus] || STATUS_DISPLAY.PENDING;
  const fromStatusConfig = STATUS_DISPLAY[fromStatus] || null;

  const statusChangeHtml = fromStatusConfig
    ? `
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 20px 0;">
        <span style="
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          background-color: ${fromStatusConfig.bgColor};
          color: ${fromStatusConfig.color};
        ">${fromStatusConfig.label}</span>
        <span style="color: #9ca3af; font-size: 20px;">→</span>
        <span style="
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          background-color: ${toStatusConfig.bgColor};
          color: ${toStatusConfig.color};
        ">${toStatusConfig.label}</span>
      </div>
    `
    : `
      <div style="text-align: center; margin: 20px 0;">
        <span style="
          display: inline-block;
          padding: 10px 24px;
          border-radius: 20px;
          font-size: 16px;
          font-weight: 600;
          background-color: ${toStatusConfig.bgColor};
          color: ${toStatusConfig.color};
        ">${toStatusConfig.label}</span>
      </div>
    `;

  const adminNoteHtml = adminNote
    ? `
      <div style="
        background: #f0f9ff;
        border-left: 4px solid #0ea5e9;
        padding: 16px 20px;
        border-radius: 0 8px 8px 0;
        margin: 24px 0;
      ">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #0369a1; font-size: 14px;">
          📝 Note from Support Team:
        </p>
        <p style="margin: 0; color: #1e40af; white-space: pre-wrap; line-height: 1.6;">
          ${adminNote}
        </p>
      </div>
    `
    : "";

  // Determine if we should show reopen hint
  const showReopenHint = toStatus === "RESOLVED";
  const reopenHintHtml = showReopenHint
    ? `
      <div style="
        background: #fff7ed;
        border: 1px solid #fed7aa;
        padding: 12px 16px;
        border-radius: 8px;
        margin: 16px 0;
        font-size: 13px;
        color: #c2410c;
      ">
        💡 <strong>Not fully resolved?</strong> You can reopen this ticket from your dashboard if you're still experiencing issues.
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Update - ${ticketNumber}</title>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f3f4f6;
    ">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Header -->
        <div style="
          background: linear-gradient(135deg, #05015A 0%, #0a0280 100%);
          color: white;
          padding: 32px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        ">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">
            🎫 Ticket Update
          </h1>
          <p style="margin: 12px 0 0; opacity: 0.9; font-size: 16px;">
            Your support ticket has been updated
          </p>
        </div>

        <!-- Content -->
        <div style="
          background: white;
          padding: 32px;
          border: 1px solid #e5e7eb;
          border-top: none;
        ">
          <p style="margin: 0 0 20px; font-size: 16px;">
            Hello <strong>${userName}</strong>,
          </p>

          <!-- Ticket Info Box -->
          <div style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px 20px;
            margin-bottom: 24px;
          ">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 100px;">Ticket #</td>
                <td style="padding: 4px 0; font-weight: 600; color: #05015A;">${ticketNumber}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Subject</td>
                <td style="padding: 4px 0; color: #1f2937;">${subject}</td>
              </tr>
            </table>
          </div>

          <!-- Status Change -->
          <div style="text-align: center;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
              Status Update
            </p>
            ${statusChangeHtml}
            <p style="margin: 16px 0 0; color: #4b5563; font-size: 15px;">
              ${toStatusConfig.message}
            </p>
          </div>

          <!-- Admin Note -->
          ${adminNoteHtml}

          <!-- Reopen Hint -->
          ${reopenHintHtml}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0 16px;">
            <a href="${ticketUrl}" style="
              display: inline-block;
              background: linear-gradient(135deg, #05015A 0%, #0a0280 100%);
              color: white;
              padding: 14px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              font-size: 15px;
            ">
              View Ticket Details →
            </a>
          </div>

          <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; text-align: center;">
            If you have any questions, simply reply to this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="
          background: #1f2937;
          color: #9ca3af;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          border-radius: 0 0 12px 12px;
        ">
          <p style="margin: 0 0 8px;">
            © ${new Date().getFullYear()} Cureli ERP. All rights reserved.
          </p>
          <p style="margin: 0; color: #6b7280;">
            This is an automated notification regarding your support ticket.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Send ticket status update email
 * @param {Object} params
 * @param {string} params.userEmail - Recipient email
 * @param {string} params.userName - Recipient name
 * @param {string} params.ticketNumber - Ticket reference number
 * @param {string} params.subject - Ticket subject
 * @param {string} params.fromStatus - Previous status
 * @param {string} params.toStatus - New status
 * @param {string} [params.adminNote] - Optional note from admin
 * @returns {Promise<{sent: boolean, error: string|null}>}
 */
export async function sendTicketStatusEmail({
  userEmail,
  userName,
  ticketNumber,
  subject,
  fromStatus,
  toStatus,
  adminNote,
}) {
  try {
    // Build ticket URL (user dashboard)
    const frontendUrl = process.env.USER_FRONTEND_URL || "http://localhost:5173";
    const ticketUrl = `${frontendUrl}/tickets`;

    // Generate email HTML
    const html = generateTicketStatusEmailHtml({
      userName,
      ticketNumber,
      subject,
      fromStatus,
      toStatus,
      adminNote,
      ticketUrl,
    });

    // Email subject line based on status
    const emailSubject = getEmailSubject(toStatus, ticketNumber);

    // Send email
    await sendMail(userEmail, emailSubject, html);

    console.log(`✅ Ticket status email sent to ${userEmail} for ${ticketNumber}`);
    return { sent: true, error: null };
  } catch (error) {
    console.error(`❌ Failed to send ticket status email:`, error);
    return { sent: false, error: error.message };
  }
}

/**
 * Get email subject line based on status
 */
function getEmailSubject(status, ticketNumber) {
  const subjects = {
    PENDING: `[${ticketNumber}] Your ticket is being reviewed`,
    IN_PROGRESS: `[${ticketNumber}] Support is working on your ticket`,
    RESOLVED: `[${ticketNumber}] Your ticket has been resolved ✓`,
    CLOSED: `[${ticketNumber}] Your ticket has been closed`,
    CANCELLED: `[${ticketNumber}] Your ticket has been cancelled`,
  };

  return subjects[status] || `[${ticketNumber}] Ticket Status Update`;
}

/**
 * Send ticket created confirmation email (optional - for future use)
 */
export async function sendTicketCreatedEmail({
  userEmail,
  userName,
  ticketNumber,
  subject,
  category,
}) {
  try {
    const frontendUrl = process.env.USER_FRONTEND_URL || "http://localhost:5173";
    const ticketUrl = `${frontendUrl}/tickets`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="
        margin: 0;
        padding: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #1f2937;
        background-color: #f3f4f6;
      ">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="
            background: linear-gradient(135deg, #05015A 0%, #0a0280 100%);
            color: white;
            padding: 32px;
            text-align: center;
            border-radius: 12px 12px 0 0;
          ">
            <h1 style="margin: 0; font-size: 24px;">✅ Ticket Created</h1>
            <p style="margin: 12px 0 0; opacity: 0.9;">${ticketNumber}</p>
          </div>

          <!-- Content -->
          <div style="
            background: white;
            padding: 32px;
            border: 1px solid #e5e7eb;
            border-top: none;
          ">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>Thank you for contacting our support team. Your ticket has been successfully created.</p>

            <div style="
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px 20px;
              margin: 20px 0;
            ">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; width: 100px;">Ticket #</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #05015A;">${ticketNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Subject</td>
                  <td style="padding: 6px 0;">${subject}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Category</td>
                  <td style="padding: 6px 0;">${category}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">Status</td>
                  <td style="padding: 6px 0;">
                    <span style="
                      background: #fef3c7;
                      color: #f59e0b;
                      padding: 4px 12px;
                      border-radius: 12px;
                      font-size: 13px;
                      font-weight: 600;
                    ">Pending</span>
                  </td>
                </tr>
              </table>
            </div>

            <p style="color: #4b5563;">
              Our support team typically responds within <strong>24 business hours</strong>. 
              You'll receive an email notification when your ticket is updated.
            </p>

            <div style="text-align: center; margin: 28px 0 16px;">
              <a href="${ticketUrl}" style="
                display: inline-block;
                background: linear-gradient(135deg, #05015A 0%, #0a0280 100%);
                color: white;
                padding: 14px 32px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
              ">
                View Your Tickets →
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="
            background: #1f2937;
            color: #9ca3af;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            border-radius: 0 0 12px 12px;
          ">
            <p style="margin: 0;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
          </div>

        </div>
      </body>
      </html>
    `;

    await sendMail(userEmail, `[${ticketNumber}] Ticket Created - We've received your request`, html);

    console.log(`✅ Ticket created email sent to ${userEmail}`);
    return { sent: true, error: null };
  } catch (error) {
    console.error(`❌ Failed to send ticket created email:`, error);
    return { sent: false, error: error.message };
  }
}