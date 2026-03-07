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
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;padding:8px 18px;border-radius:20px;font-size:13px;font-weight:600;background:${fromConfig.bgColor};color:${fromConfig.color};">${fromConfig.label}</span>
        <span style="color:#9ca3af;font-size:24px;margin:0 12px;font-weight:300;">→</span>
        <span style="display:inline-block;padding:8px 18px;border-radius:20px;font-size:13px;font-weight:700;background:${toConfig.bgColor};color:${toConfig.color};">${toConfig.label}</span>
      </div>
    `
    : `
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;padding:10px 24px;border-radius:20px;font-size:15px;font-weight:700;background:${toConfig.bgColor};color:${toConfig.color};">${toConfig.label}</span>
      </div>
    `;

  const adminNoteHtml = admin_note
    ? `
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:16px 20px;border-radius:0 10px 10px 0;margin:24px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#05015A;font-size:13px;"> Note from Cureli Health Support:</p>
        <p style="margin:0;color:#374151;white-space:pre-wrap;line-height:1.6;font-size:14px;">${admin_note}</p>
      </div>
    `
    : '';

  const reopenHintHtml = to_status === 'RESOLVED'
    ? `
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;margin:20px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
           <strong>Not fully resolved?</strong> You can reopen this ticket from your dashboard if you're still experiencing issues.
        </p>
      </div>
    `
    : '';

  const emailSubjects = {
    PENDING: `[${ticket_number}] Your ticket is being reviewed - Cureli`,
    IN_PROGRESS: `[${ticket_number}] Support is working on your ticket - Cureli`,
    RESOLVED: `[${ticket_number}] Your ticket has been resolved ✓ - Cureli`,
    CLOSED: `[${ticket_number}] Your ticket has been closed - Cureli`,
    CANCELLED: `[${ticket_number}] Your ticket has been cancelled - Cureli`,
  };

  const subject = emailSubjects[to_status] || `[${ticket_number}] Ticket Status Update - Cureli`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ticket Update - Cureli</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:560px;margin:0 auto;padding:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
          <h1 style="margin:0;font-size:22px;font-weight:600;">🎫 Ticket Update</h1>
          <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Your support ticket has been updated</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          
          <p style="font-size:15px;color:#333;margin:0 0 16px;">
            Hello <strong style="color:#05015A;">${displayName}</strong>,
          </p>

          <!-- Ticket Info Box -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">Ticket #</td>
                <td style="padding:6px 0;font-weight:700;font-size:14px;color:#05015A;font-family:'Courier New',monospace;">${ticket_number}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:13px;">Subject</td>
                <td style="padding:6px 0;color:#1f2937;font-weight:600;font-size:14px;">${ticketSubject || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <!-- Status Change -->
          <div style="background:#f9fafb;border-radius:10px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 12px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;font-weight:600;">Status Update</p>
            ${statusChangeHtml}
            <p style="margin:16px 0 0;color:#4b5563;font-size:14px;text-align:center;line-height:1.6;">${toConfig.message}</p>
          </div>

          ${adminNoteHtml}
          ${reopenHintHtml}

          <!-- CTA Button -->
          <div style="text-align:center;margin:28px 0;">
            <a href="${FRONTEND_URL}/tickets" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
               View Ticket Details
            </a>
          </div>

          <!-- Support Info -->
          <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
            Questions? Contact <a href="mailto:support@cureli.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
          </p>

        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
          <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> Support</p>
          <p style="margin:0;color:#6b7280;font-size:11px;">This is an automated notification regarding your support ticket.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default ticketStatusChangedTemplate;