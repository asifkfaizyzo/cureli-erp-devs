// ============================================
// DOCUMENT REJECTED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function documentRejectedTemplate(context) {
  const {
    recipientName,
    shop_name,
    business_name,
    reason,
    summary = {},
  } = context;

  const shopName = shop_name || business_name || 'your shop';
  const { approved = 0, rejected = 0, pending = 0 } = summary;

  const subject = 'Action Required: Document review feedback - Cureli';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Review Result - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;">📋 Document Review Result</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Action Required</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        The admin has reviewed your documents for <strong style="color:#05015A;">${shopName}</strong>.
      </p>

      <!-- Summary Box -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px 22px;margin:24px 0;">
        <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">Review Summary:</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;color:#059669;font-weight:600;font-size:14px;">✅ Approved</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#059669;">${approved}</td>
          </tr>
          <tr style="border-top:1px solid #e5e7eb;">
            <td style="padding:10px 0;color:#dc2626;font-weight:600;font-size:14px;">❌ Rejected</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#dc2626;">${rejected}</td>
          </tr>
          <tr style="border-top:1px solid #e5e7eb;">
            <td style="padding:10px 0;color:#f59e0b;font-weight:600;font-size:14px;">⏳ Pending</td>
            <td style="padding:10px 0;text-align:right;font-weight:700;font-size:16px;color:#f59e0b;">${pending}</td>
          </tr>
        </table>
      </div>

      ${reason ? `
      <!-- Rejection Reason -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 6px;font-weight:600;color:#991b1b;font-size:13px;">⚠️ Reason for Rejection:</p>
        <p style="margin:0;color:#7f1d1d;font-style:italic;font-size:14px;line-height:1.5;">"${reason}"</p>
      </div>
      ` : ''}

      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">
        Please log in to review the rejected documents. You can make corrections and resubmit for another review.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/onboarding?resume_step=documents" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
          📄 Review Documents →
        </a>
      </div>

      <!-- Help Note -->
      <p style="font-size:13px;color:#888;margin:20px 0 0;line-height:1.5;text-align:center;">
        Need help? Contact our support team for assistance.
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> ERP</p>
      <p style="margin:0;">All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default documentRejectedTemplate;