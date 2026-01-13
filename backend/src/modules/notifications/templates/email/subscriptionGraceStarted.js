// ============================================
// SUBSCRIPTION GRACE STARTED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionGraceStartedTemplate(context) {
  const { 
    recipientName, 
    shop_name, 
    business_name,
    grace_period_until,
    plan_name 
  } = context;
  
  const shopName = shop_name || business_name || 'your shop';
  
  const graceEndDate = grace_period_until 
    ? new Date(grace_period_until).toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'soon';

  const subject = '⚠️ Your subscription has expired - Grace period active - Cureli';

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
        <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;">⚠️ Grace Period Active</h1>
          <p style="margin:12px 0 0;opacity:0.9;font-size:16px;">Your subscription has expired</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#b45309;font-weight:600;">
              Your subscription for <strong>${shopName}</strong> has expired.
            </p>
            <p style="margin:8px 0 0;color:#92400e;font-size:14px;">
              You are now in a grace period until <strong>${graceEndDate}</strong>.
            </p>
          </div>

          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:20px 0;">
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Shop</td>
              <td style="padding:12px 16px;color:#1f2937;font-weight:500;border-bottom:1px solid #e5e7eb;">${shopName}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Plan</td>
              <td style="padding:12px 16px;color:#1f2937;font-weight:500;border-bottom:1px solid #e5e7eb;">${plan_name || 'Standard'}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Status</td>
              <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
                <span style="background:#fef3c7;color:#f59e0b;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;">Grace Period</span>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;">Grace Ends</td>
              <td style="padding:12px 16px;color:#dc2626;font-weight:600;">${graceEndDate}</td>
            </tr>
          </table>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            During the grace period, you still have access to your dashboard. However, 
            if you don't renew before <strong>${graceEndDate}</strong>, your account will be 
            <strong style="color:#dc2626;">suspended</strong>.
          </p>

          <p style="font-size:15px;color:#dc2626;font-weight:600;">
            🚨 Renew now to avoid losing access to your data and services.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:#dc2626;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Renew Subscription →
            </a>
          </div>

          <p style="font-size:14px;color:#6b7280;">
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

export default subscriptionGraceStartedTemplate;