// ============================================
// PASSWORD CHANGED NOTIFICATION TEMPLATE
// ============================================

export function passwordChangedTemplate(context) {
  const { recipientName, changed_at } = context;

  const subject = 'Password Changed - Cureli';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;">🔐 Password Changed</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Security Notification</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hi <strong style="color:#05015A;">${recipientName || 'there'}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        This is a confirmation that your password was successfully changed for your <strong>Cureli</strong> account.
      </p>

      <!-- Success Box -->
      <div style="background:#f0fdf4;border-left:4px solid #059669;padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 6px;color:#065f46;font-size:13px;font-weight:600;">✅ Change Successful</p>
        <p style="margin:0;color:#047857;font-size:13px;">
          <strong>Date & Time:</strong> ${changed_at || new Date().toLocaleString()}
        </p>
      </div>

      <!-- Security Warning -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">
          ⚠️ <strong>Didn't make this change?</strong><br>
          If you did not authorize this password change, please contact our support team immediately to secure your account.
        </p>
      </div>

      <!-- Security Tips -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 8px;color:#05015A;font-size:13px;font-weight:600;">🔒 Security Tips:</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:12px;line-height:1.6;">
          <li>Never share your password with anyone</li>
          <li>Use a unique password for your Cureli account</li>
          <li>Enable two-factor authentication if available</li>
        </ul>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Questions? Contact us at <a href="mailto:support@cureli.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@cureli.com</a>
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

export default passwordChangedTemplate;