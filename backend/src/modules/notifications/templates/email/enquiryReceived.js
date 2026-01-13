// ============================================
// ENQUIRY RECEIVED EMAIL TEMPLATE
// ============================================

export function enquiryReceivedTemplate(context) {
  const { recipientName, name, enquiry_number, message } = context;
  const displayName = recipientName || name || 'there';

  const subject = `[${enquiry_number}] We've received your enquiry - Cureli`;

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
          <h1 style="margin:0;font-size:28px;">📬 Enquiry Received</h1>
          <p style="margin:12px 0 0;opacity:0.9;font-size:16px;">Reference: ${enquiry_number}</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${displayName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Thank you for reaching out to us! We've received your enquiry and our team will get back to you soon.
          </p>

          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:20px 0;">
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;">Reference #</td>
              <td style="padding:12px 16px;color:#05015A;font-weight:700;">${enquiry_number}</td>
            </tr>
          </table>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0;">
            <p style="margin:0 0 8px;font-weight:600;color:#374151;">Your message:</p>
            <p style="margin:0;color:#4b5563;white-space:pre-wrap;font-style:italic;">"${message}"</p>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            We typically respond within <strong>24-48 business hours</strong>. 
            Please keep this reference number for future correspondence.
          </p>

          <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#0369a1;font-size:14px;">
              💡 If your matter is urgent, please mention the reference number when you contact us again.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 8px;">We'll be in touch soon!</p>
          <p style="margin:0;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default enquiryReceivedTemplate;