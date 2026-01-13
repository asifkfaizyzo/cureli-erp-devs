// ============================================
// SUBSCRIPTION SUSPENDED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionSuspendedTemplate(context) {
  const { recipientName, shop_name } = context;

  const subject = '⛔ Your account has been suspended';

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
        <div style="background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">⛔ Account Suspended</h1>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <div style="background:#f3f4f6;border-left:4px solid #6b7280;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#374151;font-weight:600;">
              Your shop <strong>${shop_name || 'your shop'}</strong> has been suspended due to non-payment.
            </p>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Your subscription has expired and the grace period has ended. Your account is now suspended.
          </p>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            <strong>To restore access:</strong>
          </p>
          <ol style="color:#444;font-size:14px;line-height:1.8;">
            <li>Log in to your account</li>
            <li>Go to Subscription settings</li>
            <li>Complete the payment to reactivate</li>
          </ol>

          <div style="background:#d1fae5;border:1px solid #10b981;border-radius:8px;padding:16px;margin:24px 0;">
            <p style="margin:0;color:#065f46;font-size:14px;">
              <strong>Good news:</strong> Your data is safe! Once you renew, everything will be restored.
            </p>
          </div>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Reactivate Account →
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

export default subscriptionSuspendedTemplate;