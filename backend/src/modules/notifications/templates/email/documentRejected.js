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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">📋 Document Review Result</h1>
          <p style="margin:12px 0 0;opacity:0.9;">Action required</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            The admin has reviewed your documents for <strong>${shopName}</strong>.
          </p>

          <!-- Summary Box -->
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#059669;font-weight:600;">✓ Approved:</td>
                <td style="padding:8px 0;text-align:right;font-weight:600;">${approved}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#dc2626;font-weight:600;">✗ Rejected:</td>
                <td style="padding:8px 0;text-align:right;font-weight:600;">${rejected}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#f59e0b;font-weight:600;">⏳ Pending:</td>
                <td style="padding:8px 0;text-align:right;font-weight:600;">${pending}</td>
              </tr>
            </table>
          </div>

          ${reason ? `
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 8px;font-weight:600;color:#991b1b;">Reason for rejection:</p>
            <p style="margin:0;color:#7f1d1d;font-style:italic;">"${reason}"</p>
          </div>
          ` : ''}

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Please log in and review the rejected documents. You can resubmit them for another review.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/onboarding?resume_step=documents" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Review Documents →
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

export default documentRejectedTemplate;