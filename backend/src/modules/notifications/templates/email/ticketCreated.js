// ============================================
// TICKET CREATED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function ticketCreatedTemplate(context) {
  const {
    recipientName,
    ticket_number,
    ticketNumber,
    subject: ticketSubject,
    category,
  } = context;

  const ticketNum = ticket_number || ticketNumber;
  const displayCategory = category?.replace(/_/g, ' ') || 'General';

  const subject = `[${ticketNum}] Ticket Created - We've received your request`;

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
          <h1 style="margin:0;font-size:24px;">✅ Ticket Created</h1>
          <p style="margin:12px 0 0;opacity:0.9;font-size:18px;font-weight:600;">${ticketNum}</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Thank you for contacting our support team. Your ticket has been successfully created.
          </p>

          <!-- Ticket Info Box -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;color:#6b7280;width:100px;">Ticket #</td>
                <td style="padding:6px 0;font-weight:600;color:#05015A;">${ticketNum}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;">Subject</td>
                <td style="padding:6px 0;">${ticketSubject || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;">Category</td>
                <td style="padding:6px 0;">${displayCategory}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;">Status</td>
                <td style="padding:6px 0;">
                  <span style="background:#fef3c7;color:#f59e0b;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;">
                    Pending
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Our support team typically responds within <strong>24 business hours</strong>. 
            You'll receive an email notification when your ticket is updated.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/tickets" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              View Your Tickets →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default ticketCreatedTemplate;