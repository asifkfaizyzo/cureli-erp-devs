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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Final Warning - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:700;">🚨 FINAL WARNING</h1>
      <p style="margin:8px 0 0;font-size:15px;opacity:0.95;font-weight:600;">Account Suspension Imminent</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 16px;">
        Hello <strong style="color:#dc2626;">${recipientName}</strong>,
      </p>
      
      <!-- Critical Alert -->
      <div style="background:#fef2f2;border:3px solid #dc2626;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
        <p style="margin:0;color:#991b1b;font-size:18px;font-weight:700;">
          ⚠️ Your grace period ends TOMORROW!
        </p>
        <p style="margin:12px 0 0;color:#7f1d1d;font-size:14px;font-weight:600;">
          Grace Period Ends: ${grace_period_until ? new Date(grace_period_until).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          }) : 'Tomorrow'}
        </p>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        This is your <strong style="color:#dc2626;">FINAL WARNING</strong>. Your shop <strong style="color:#05015A;">${shop_name || 'your shop'}</strong> will be <strong style="color:#dc2626;">SUSPENDED</strong> if you don't renew your <strong>Cureli</strong> subscription immediately.
      </p>

      <!-- Consequences Box -->
      <div style="background:#fff7ed;border-left:4px solid #f59e0b;padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 10px;color:#92400e;font-size:14px;font-weight:700;">
          ⚡ What Happens When Suspended:
        </p>
        <ul style="margin:0;padding-left:20px;color:#78350f;font-size:13px;line-height:1.7;">
          <li><strong>Your shop and all branches will be inaccessible</strong></li>
          <li>Your staff cannot log in to Cureli</li>
          <li>All business operations will be halted</li>
          <li>No access to inventory, sales, or reports</li>
          <li>Data remains safe but locked until renewal</li>
        </ul>
      </div>

      <!-- Urgent CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;padding:16px 44px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 4px 14px rgba(220,38,38,0.4);text-transform:uppercase;letter-spacing:0.5px;">
          🔄 RENEW NOW - Avoid Suspension
        </a>
      </div>

      <!-- Help Section -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;line-height:1.6;">
          💡 <strong>Need Immediate Help?</strong><br>
          Contact our support team right away. We're here to help you avoid suspension.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        <strong>Emergency Support:</strong> <a href="mailto:support@cureli.com" style="color:#dc2626;text-decoration:none;font-weight:600;">support@cureli.com</a>
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

export default subscriptionGraceEndingTemplate;