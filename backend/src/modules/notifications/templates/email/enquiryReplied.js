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
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Enquiry Response - Cureli Health</title>
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:560px;margin:0 auto;padding:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
          <h1 style="margin:0;font-size:22px;font-weight:600;"> Response to Your Enquiry</h1>
          <p style="margin:10px 0 0;opacity:0.9;font-size:14px;">Reference: <strong>${enquiry_number}</strong></p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          
          <p style="font-size:15px;color:#333;margin:0 0 12px;">
            Hello <strong style="color:#05015A;">${displayName}</strong>,
          </p>
          
          <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
            Thank you for your patience. Here's our response to your enquiry:
          </p>

          <!-- Reference Info -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:100px;">Reference</td>
                <td style="padding:12px 16px;color:#05015A;font-weight:700;font-size:14px;border-bottom:1px solid #e5e7eb;">${enquiry_number}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Subject</td>
                <td style="padding:12px 16px;color:#1f2937;font-weight:500;font-size:14px;">${reply_subject}</td>
              </tr>
            </table>
          </div>

          <!-- Reply Message -->
          <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:18px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
            <p style="margin:0 0 10px;font-weight:600;color:#05015A;font-size:13px;"> Our Response:</p>
            <p style="margin:0;color:#374151;line-height:1.7;font-size:14px;">
              ${formattedMessage}
            </p>
          </div>

          <!-- Follow-up Info -->
          <div style="background:#fefce8;border-left:4px solid #eab308;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#854d0e;font-size:13px;">
               <strong>Need more help?</strong> Reply to this email with your reference number.
            </p>
          </div>

          <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
            Thank you for choosing <strong style="color:#05015A;">Cureli Health</strong>!
          </p>

        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
          <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> Health</p>
          <p style="margin:0;">All rights reserved</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default enquiryRepliedTemplate;