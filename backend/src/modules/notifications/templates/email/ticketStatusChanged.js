// ============================================
// TICKET STATUS CHANGED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

const STATUS_DISPLAY = {
  PENDING: { label: 'Pending', color: '#f59e0b', bgColor: '#fef3c7', message: 'Your ticket is awaiting review by our support team.' },
  IN_PROGRESS: { label: 'In Progress', color: '#3b82f6', bgColor: '#dbeafe', message: 'Our support team is actively working on your ticket.' },
  RESOLVED: { label: 'Resolved', color: '#10b981', bgColor: '#d1fae5', message: "Your issue has been resolved. If you're still experiencing problems, you can reopen this ticket." },
  CLOSED: { label: 'Closed', color: '#6b7280', bgColor: '#f3f4f6', message: 'This ticket has been closed. Thank you for contacting support.' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2', message: 'This ticket has been cancelled.' },
};

export function ticketStatusChangedTemplate(context) {
  const {
    recipientName,
    name,
    ticket_number,
    subject: ticketSubject,
    from_status,
    to_status,
    admin_note,
  } = context;

  const displayName = recipientName || name || 'Customer';
  const toConfig = STATUS_DISPLAY[to_status] || STATUS_DISPLAY.PENDING;
  const fromConfig = from_status ? STATUS_DISPLAY[from_status] : null;

  const statusChangeHtml = fromConfig
    ? `
      <div style="text-align:center;margin:20px 0;">
        <span style="display:inline-block;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;background:${fromConfig.bgColor};color:${fromConfig.color};">${fromConfig.label}</span>
        <span style="color:#9ca3af;font-size:20px;margin:0 10px;">→</span>
        <span style="display:inline-block;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:600;background:${toConfig.bgColor};color:${toConfig.color};">${toConfig.label}</span>
      </div>
    `
    : `
      <div style="text-align:center;margin:20px 0;">
        <span style="display:inline-block;padding:10px 24px;border-radius:20px;font-size:16px;font-weight:600;background:${toConfig.bgColor};color:${toConfig.color};">${toConfig.label}</span>
      </div>
    `;

  const adminNoteHtml = admin_note
    ? `
      <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0369a1;font-size:14px;">📝 Note from Support Team:</p>
        <p style="margin:0;color:#1e40af;white-space:pre-wrap;line-height:1.6;">${admin_note}</p>
      </div>
    `
    : '';

  const reopenHintHtml = to_status === 'RESOLVED'
    ? `
      <div style="background:#fff7ed;border:1px solid #fed7aa;padding:12px 16px;border-radius:8px;margin:16px 0;font-size:13px;color:#c2410c;">
        💡 <strong>Not fully resolved?</strong> You can reopen this ticket from your dashboard if you're still experiencing issues.
      </div>
    `
    : '';

  const emailSubjects = {
    PENDING: `[${ticket_number}] Your ticket is being reviewed`,
    IN_PROGRESS: `[${ticket_number}] Support is working on your ticket`,
    RESOLVED: `[${ticket_number}] Your ticket has been resolved ✓`,
    CLOSED: `[${ticket_number}] Your ticket has been closed`,
    CANCELLED: `[${ticket_number}] Your ticket has been cancelled`,
  };

  const subject = emailSubjects[to_status] || `[${ticket_number}] Ticket Status Update`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">🎫 Ticket Update</h1>
          <p style="margin:12px 0 0;opacity:0.9;">Your support ticket has been updated</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${displayName}</strong>,</p>

          <!-- Ticket Info Box -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:13px;width:100px;">Ticket #</td>
                <td style="padding:4px 0;font-weight:600;color:#05015A;">${ticket_number}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#6b7280;font-size:13px;">Subject</td>
                <td style="padding:4px 0;color:#1f2937;">${ticketSubject || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Status Change -->
          <div style="text-align:center;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">Status Update</p>
            ${statusChangeHtml}
            <p style="margin:16px 0 0;color:#4b5563;font-size:15px;">${toConfig.message}</p>
          </div>

          ${adminNoteHtml}
          ${reopenHintHtml}

          <div style="text-align:center;margin:32px 0 16px;">
            <a href="${FRONTEND_URL}/tickets" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              View Ticket Details →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 8px;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
          <p style="margin:0;color:#6b7280;">This is an automated notification regarding your support ticket.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default ticketStatusChangedTemplate;