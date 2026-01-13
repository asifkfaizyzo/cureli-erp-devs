// ============================================
// SUBSCRIPTION GRACE ENDING EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionGraceEndingTemplate(context) {
  const {
    recipientName,
    shop_name,
    grace_period_until,
  } = context;

  const subject = '🚨 URGENT: Your account will be suspended tomorrow';

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
          <h1 style="margin:0;font-size:24px;">🚨 Final Warning</h1>
          <p style="margin:12px 0 0;font-size:18px;">Account suspension imminent</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <div style="background:#fef2f2;border:2px solid #dc2626;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
            <p style="margin:0;color:#991b1b;font-size:16px;font-weight:600;">
              Your grace period ends tomorrow!
            </p>
            <p style="margin:8px 0 0;color:#7f1d1d;font-size:14px;">
              Grace period ends: ${grace_period_until ? new Date(grace_period_until).toLocaleDateString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              }) : 'Tomorrow'}
            </p>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Your shop <strong>${shop_name || 'your shop'}</strong> will be <strong>suspended</strong> if you don't renew your subscription immediately.
          </p>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            <strong>What happens when suspended:</strong>
          </p>
          <ul style="color:#444;font-size:14px;line-height:1.8;">
            <li>Your shop and all branches will be inaccessible</li>
            <li>Your staff cannot log in</li>
            <li>All operations will be halted</li>
          </ul>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:white;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              RENEW NOW - Avoid Suspension
            </a>
          </div>

          <p style="font-size:13px;color:#666;text-align:center;">
            Need help? Contact our support team immediately.
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

export default subscriptionGraceEndingTemplate;