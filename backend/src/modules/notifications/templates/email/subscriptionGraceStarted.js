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

  const subject = ' Your subscription has expired - Grace period active - Cureli Health';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grace Period Active - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Grace Period Active</h1>
      <p style="margin:8px 0 0;opacity:0.95;font-size:14px;">Your subscription has expired</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 16px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <!-- Alert Box -->
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px 20px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 8px;color:#b45309;font-weight:600;font-size:14px;">
          Your <strong>Cureli Health</strong> subscription for <strong>${shopName}</strong> has expired.
        </p>
        <p style="margin:0;color:#92400e;font-size:13px;">
          You are now in a grace period until <strong>${graceEndDate}</strong>.
        </p>
      </div>

      <!-- Account Details -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:100px;">Shop</td>
            <td style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;">${shopName}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Plan</td>
            <td style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;">${plan_name || 'Standard'}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Status</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
              <span style="background:#fef3c7;color:#f59e0b;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">GRACE PERIOD</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Grace Ends</td>
            <td style="padding:12px 16px;color:#dc2626;font-weight:700;font-size:14px;">${graceEndDate}</td>
          </tr>
        </table>
      </div>

      <!-- Important Info -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">
           <strong>Important:</strong> During the grace period, you still have access to your dashboard. However, if you don't renew before <strong>${graceEndDate}</strong>, your account will be <strong>SUSPENDED</strong>.
        </p>
      </div>

      <!-- What Happens -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 8px;color:#05015A;font-size:13px;font-weight:600;"> What Happens If You Don't Renew:</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:12px;line-height:1.6;">
          <li>Complete loss of access to Cureli Health</li>
          <li>Your shop and branches will be locked</li>
          <li>Staff cannot log in or perform operations</li>
          <li>All business activities will halt</li>
        </ul>
      </div>

      <!-- Urgent CTA -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 3px 10px rgba(220,38,38,0.3);">
           Renew Now - Avoid Suspension
        </a>
      </div>

      <!-- Support -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;">
           <strong>Need Help?</strong> Contact our support team immediately for assistance with renewal.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        <strong>Support:</strong> <a href="mailto:support@curelihealth.com" style="color:#dc2626;text-decoration:none;font-weight:600;">support@curelihealth.com</a>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> Health</p>
      <p style="margin:0;">All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default subscriptionGraceStartedTemplate;