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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Created - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Ticket Created</h1>
      <p style="margin:10px 0 0;opacity:0.95;font-size:18px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px;">${ticketNum}</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Thank you for contacting <strong>Cureli</strong> support. Your ticket has been successfully created and assigned to our team.
      </p>

      <!-- Ticket Info Box -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:24px 0;">
        <h3 style="margin:0 0 14px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;">Ticket Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;">Ticket #</td>
            <td style="padding:8px 0;font-weight:700;font-size:14px;color:#05015A;font-family:'Courier New',monospace;">${ticketNum}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Subject</td>
            <td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827;">${ticketSubject || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Category</td>
            <td style="padding:8px 0;font-size:14px;color:#374151;">${displayCategory}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Status</td>
            <td style="padding:8px 0;">
              <span style="background:#fef3c7;color:#f59e0b;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">
                PENDING
              </span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Response Time -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;line-height:1.6;">
           <strong>Response Time:</strong> Our support team typically responds within <strong>24 business hours</strong>. You'll receive an email notification when your ticket is updated.
        </p>
      </div>

      <!-- What's Next -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 8px;color:#92400e;font-size:13px;font-weight:600;"> What Happens Next:</p>
        <ul style="margin:0;padding-left:20px;color:#78350f;font-size:12px;line-height:1.6;">
          <li>Our team will review your ticket</li>
          <li>You'll receive updates via email</li>
          <li>Track progress in your tickets dashboard</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/tickets" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
           View Your Tickets
        </a>
      </div>

      <!-- Support Info -->
      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Need urgent help? Contact us at <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@cureli.com</a>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli Health</strong> Support</p>
      <p style="margin:0;">All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default ticketCreatedTemplate;