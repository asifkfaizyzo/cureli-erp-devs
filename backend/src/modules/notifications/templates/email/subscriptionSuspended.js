// ============================================
// SUBSCRIPTION SUSPENDED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionSuspendedTemplate(context) {
  const { recipientName, shop_name } = context;

  const subject = ' Your account has been suspended';

  const html = `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Account Suspended - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6b7280 0%,#4b5563 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Account Suspended</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Action Required to Restore Access</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 16px;">
        Hello <strong style="color:#374151;">${recipientName}</strong>,
      </p>
      
      <!-- Suspension Notice -->
      <div style="background:#f3f4f6;border-left:4px solid #6b7280;padding:16px 20px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#374151;font-weight:600;font-size:14px;">
          Your <strong>Cureli Health</strong> account for <strong>${shop_name || 'your shop'}</strong> has been suspended due to non-payment.
        </p>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Your subscription has expired and the grace period has ended. As a result, your account is now suspended and access to all services has been temporarily disabled.
      </p>

      <!-- Impact Box -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 8px;color:#991b1b;font-size:13px;font-weight:600;"> Currently Unavailable:</p>
        <ul style="margin:0;padding-left:20px;color:#7f1d1d;font-size:12px;line-height:1.6;">
          <li>Access to Cureli Health dashboard and all features</li>
          <li>Staff login and operations</li>
          <li>Inventory management and sales tracking</li>
          <li>Reports and analytics</li>
        </ul>
      </div>

      <!-- Restoration Steps -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 10px;color:#05015A;font-size:14px;font-weight:600;"> To Restore Access:</p>
        <ol style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.7;">
          <li>Log in to your Cureli Health account</li>
          <li>Navigate to Subscription settings</li>
          <li>Complete the payment to reactivate</li>
          <li>Access will be restored immediately</li>
        </ol>
      </div>

      <!-- Data Safety -->
      <div style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border:2px solid #10b981;border-radius:10px;padding:16px 20px;margin:24px 0;text-align:center;">
        <p style="margin:0;color:#065f46;font-size:14px;font-weight:600;">
           <strong>Good News:</strong> Your data is completely safe!
        </p>
        <p style="margin:6px 0 0;color:#047857;font-size:12px;">
          Once you renew, everything will be restored exactly as it was.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
           Reactivate Account Now
        </a>
      </div>

      <!-- Support -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;">
           <strong>Need Help?</strong> Contact our support team for assistance with reactivation.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Support: <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
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

export default subscriptionSuspendedTemplate;