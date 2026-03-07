// ============================================
// CADMIN PASSWORD RESET EMAIL TEMPLATE
// ============================================

export function cadminPasswordResetTemplate(context) {
  const { recipientName, resetUrl } = context;

  const subject = 'Reset Your Cureli Admin Password';

  const html = `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Cureli Password</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:80px;margin-bottom:10px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;">Cureli Admin Panel</h1>
      <p style="margin:6px 0 0;opacity:0.9;font-size:13px;">Secure Access Management</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <h2 style="color:#05015A;font-size:20px;margin:0 0 16px;font-weight:600;">Reset Your Password</h2>

      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">
        We received a request to reset your password for your Cureli Admin account. Click the button below to set a new password.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
          🔒 Reset Password
        </a>
      </div>

      <!-- Alternative Link -->
      <div style="background:#f9fafb;padding:14px;border-radius:8px;margin:20px 0;">
        <p style="font-size:12px;color:#666;margin:0 0 6px;">Or copy this link:</p>
        <p style="word-break:break-all;font-size:12px;margin:0;">
          <a href="${resetUrl}" style="color:#05015A;text-decoration:none;">${resetUrl}</a>
        </p>
      </div>

      <!-- Warning -->
      <div style="background:#fef3c7;border-left:3px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;">
          ⚠️ This link expires in <strong>15 minutes</strong>
        </p>
      </div>

      <!-- Security Note -->
      <p style="font-size:13px;color:#888;margin:20px 0 0;line-height:1.5;">
        Didn't request this? You can safely ignore this email — your password won't change.
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;">© 2025 <strong>Cureli</strong> — Admin Panel</p>
      <p style="margin:0;">Secure authentication system</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default cadminPasswordResetTemplate;