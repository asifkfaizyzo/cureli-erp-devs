// ============================================
// ENQUIRY RECEIVED EMAIL TEMPLATE
// ============================================

export function enquiryReceivedTemplate(context) {
  const { recipientName, name, enquiry_number, message } = context;
  const displayName = recipientName || name || 'there';

  const subject = `[${enquiry_number}] We've received your enquiry - Cureli`;

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enquiry Received - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:24px;font-weight:600;">📬 Enquiry Received</h1>
      <p style="margin:10px 0 0;opacity:0.9;font-size:14px;">Reference: <strong>${enquiry_number}</strong></p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${displayName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Thank you for reaching out to <strong>Cureli</strong>! We've received your enquiry and our team will review it shortly.
      </p>

      <!-- Reference Box -->
      <div style="background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border:2px solid #05015A;border-radius:10px;padding:16px 20px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Your Reference Number</p>
        <p style="margin:0;color:#05015A;font-weight:700;font-size:20px;font-family:'Courier New',monospace;letter-spacing:2px;">${enquiry_number}</p>
      </div>

      <!-- Message Box -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 20px;margin:24px 0;">
        <p style="margin:0 0 10px;font-weight:600;color:#374151;font-size:14px;">📝 Your Message:</p>
        <p style="margin:0;color:#4b5563;white-space:pre-wrap;font-style:italic;line-height:1.6;font-size:14px;">"${message}"</p>
      </div>

      <!-- Response Time -->
      <div style="background:#f0fdf4;border-left:4px solid #059669;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#065f46;font-size:13px;">
          ⏱️ <strong>Response Time:</strong> We typically respond within 24-48 business hours.
        </p>
      </div>

      <!-- Tip Box -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;">
          💡 <strong>Tip:</strong> Save this reference number for any follow-up communication.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        If your matter is urgent, please mention the reference number when contacting us.
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;font-size:13px;">We'll be in touch soon! 💬</p>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> ERP</p>
      <p style="margin:0;">All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default enquiryReceivedTemplate;