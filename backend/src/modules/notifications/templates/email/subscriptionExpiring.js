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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Expiring - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,${urgencyColor} 0%,${urgencyColor}dd 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;">${urgencyIcon} Subscription Expiring Soon</h1>
      <p style="margin:12px 0 0;font-size:36px;font-weight:700;letter-spacing:-1px;">${daysLeft} days left</p>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Action Required</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Your <strong>Cureli</strong> subscription for <strong style="color:#05015A;">${shop_name || 'your shop'}</strong> is expiring soon. Please renew to continue enjoying uninterrupted service.
      </p>

      <!-- Expiry Details -->
      <div style="background:${urgencyBg};border:2px solid ${urgencyColor};border-radius:10px;padding:18px 20px;margin:24px 0;">
        <h3 style="margin:0 0 12px;font-size:13px;color:${urgencyColor};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Subscription Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${plan_name ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:100px;">Plan</td>
            <td style="padding:8px 0;font-weight:600;font-size:14px;color:#111827;">${plan_name}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Expires On</td>
            <td style="padding:8px 0;font-weight:700;font-size:14px;color:${urgencyColor};">
              ${end_date ? new Date(end_date).toLocaleDateString('en-IN', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              }) : 'Soon'}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Time Left</td>
            <td style="padding:8px 0;font-weight:700;font-size:16px;color:${urgencyColor};">${daysLeft} days</td>
          </tr>
        </table>
      </div>

      <!-- Urgency Message -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">
          ⚠️ <strong>Important:</strong> To avoid service interruption, please renew your subscription before it expires.
        </p>
      </div>

      <!-- Benefits Reminder -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 8px;color:#05015A;font-size:13px;font-weight:600;">✨ Continue Enjoying:</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:12px;line-height:1.6;">
          <li>Full access to all Cureli ERP features</li>
          <li>Uninterrupted inventory management</li>
          <li>Sales and purchase tracking</li>
          <li>Comprehensive reports and analytics</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
          🔄 Renew Now
        </a>
      </div>

      <!-- Grace Period Warning -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:12px;line-height:1.6;">
          💡 <strong>Note:</strong> If you don't renew, your account will enter a grace period and may be suspended after expiry.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Questions about renewal? Contact us at <a href="mailto:support@cureli.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@cureli.com</a>
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

export default subscriptionExpiringTemplate;