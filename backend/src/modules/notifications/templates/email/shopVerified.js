// ============================================
// SHOP VERIFIED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function shopVerifiedTemplate(context) {
  const { recipientName, shop_name, business_name } = context;
  const shopName = shop_name || business_name || 'your shop';

  const subject = 'Congratulations! Your shop is verified - Cureli';

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
          <h1 style="margin:0;font-size:28px;">🎉 Verification Complete!</h1>
          <p style="margin:12px 0 0;opacity:0.9;font-size:16px;">Your shop is now verified</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Great news! Your shop <strong>${shopName}</strong> has been verified by our team. 
            All your documents have been approved.
          </p>

          <div style="background:#d1fae5;border-left:4px solid #10b981;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#065f46;font-weight:600;">
              ✅ Your shop is now fully operational!
            </p>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            You can now access all features of the Cureli ERP dashboard.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Go to Dashboard →
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

export default shopVerifiedTemplate;