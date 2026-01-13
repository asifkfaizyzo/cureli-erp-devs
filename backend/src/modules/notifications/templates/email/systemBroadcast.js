// ============================================
// SYSTEM BROADCAST EMAIL TEMPLATE
// ============================================

export function systemBroadcastTemplate(context) {
  const {
    recipientName,
    subject: broadcastSubject,
    message,
    sender_name = 'Cureli Team',
  } = context;

  const subject = broadcastSubject || 'Important Announcement from Cureli';

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
          <h1 style="margin:0;font-size:24px;">📢 Announcement</h1>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
            <div style="font-size:15px;color:#1e3a5f;line-height:1.7;white-space:pre-wrap;">${message}</div>
          </div>

          <p style="font-size:14px;color:#666;margin-top:24px;">
            Best regards,<br/>
            <strong>${sender_name}</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 8px;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
          <p style="margin:0;color:#6b7280;">This is a system announcement. Please do not reply to this email.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default systemBroadcastTemplate;