// ============================================
// SUBSCRIPTION EXPIRING EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionExpiringTemplate(context) {
  const {
    recipientName,
    shop_name,
    daysLeft,
    end_date,
    plan_name,
  } = context;

  const urgencyColor = daysLeft <= 3 ? '#dc2626' : '#f59e0b';
  const urgencyBg = daysLeft <= 3 ? '#fef2f2' : '#fef3c7';
  const urgencyIcon = daysLeft <= 3 ? '🚨' : '⏰';

  const subject = daysLeft <= 3
    ? `⚠️ Urgent: Your subscription expires in ${daysLeft} days`
    : `Reminder: Your subscription expires in ${daysLeft} days`;

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
        <div style="background:linear-gradient(135deg,${urgencyColor} 0%,${urgencyColor}dd 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">${urgencyIcon} Subscription Expiring</h1>
          <p style="margin:12px 0 0;font-size:32px;font-weight:bold;">${daysLeft} days left</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Your subscription for <strong>${shop_name || 'your shop'}</strong> is expiring soon.
          </p>

          <div style="background:${urgencyBg};border:1px solid ${urgencyColor}40;border-radius:8px;padding:16px 20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              ${plan_name ? `
              <tr>
                <td style="padding:6px 0;color:#6b7280;">Plan:</td>
                <td style="padding:6px 0;font-weight:600;">${plan_name}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:6px 0;color:#6b7280;">Expires on:</td>
                <td style="padding:6px 0;font-weight:600;color:${urgencyColor};">
                  ${end_date ? new Date(end_date).toLocaleDateString('en-IN', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                  }) : 'Soon'}
                </td>
              </tr>
            </table>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            To avoid any interruption in service, please renew your subscription before it expires.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Renew Now →
            </a>
          </div>

          <p style="font-size:13px;color:#666;text-align:center;">
            If you don't renew, your account will enter a grace period and may be suspended.
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

export default subscriptionExpiringTemplate;