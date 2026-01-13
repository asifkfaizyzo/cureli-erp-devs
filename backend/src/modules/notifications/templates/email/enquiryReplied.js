// ============================================
// ENQUIRY REPLIED EMAIL TEMPLATE
// ============================================

export function enquiryRepliedTemplate(context) {
  const { recipientName, name, enquiry_number, reply_subject, reply_message } = context;
  const displayName = recipientName || name || 'there';

  const subject = `[${enquiry_number}] ${reply_subject} - Cureli`;

  // Convert newlines to <br> for HTML
  const formattedMessage = (reply_message || '').replace(/\n/g, '<br/>');

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
          <h1 style="margin:0;font-size:28px;">💬 Response to Your Enquiry</h1>
          <p style="margin:12px 0 0;opacity:0.9;font-size:16px;">Reference: ${enquiry_number}</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${displayName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Thank you for your patience. Here's our response to your enquiry:
          </p>

          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:20px 0;">
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Reference #</td>
              <td style="padding:12px 16px;color:#05015A;font-weight:700;border-bottom:1px solid #e5e7eb;">${enquiry_number}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;">Subject</td>
              <td style="padding:12px 16px;color:#1f2937;font-weight:500;">${reply_subject}</td>
            </tr>
          </table>

          <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#0369a1;line-height:1.7;">
              ${formattedMessage}
            </p>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            If you have any follow-up questions, simply reply to this email with your reference number.
          </p>

          <p style="font-size:14px;color:#6b7280;margin-top:24px;">
            Thank you for your interest in Cureli ERP!
          </p>
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

export default enquiryRepliedTemplate;