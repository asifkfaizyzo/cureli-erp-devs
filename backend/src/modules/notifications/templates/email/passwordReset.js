// ============================================
// PASSWORD RESET EMAIL TEMPLATE
// ============================================

export function passwordResetTemplate(context) {
  const { recipientName, resetUrl } = context;

  const subject = 'Reset Your Password - Cureli';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Reset Your Password</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Password Recovery</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hi <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        You requested to reset your password for your <strong>Cureli Health</strong> account. Click the button below to create a new password.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
           Reset Password
        </a>
      </div>

      <!-- Alternative Link -->
      <div style="background:#f9fafb;padding:14px;border-radius:8px;margin:20px 0;">
        <p style="font-size:12px;color:#666;margin:0 0 6px;">Or copy this link:</p>
        <p style="word-break:break-all;font-size:12px;margin:0;">
          <a href="${resetUrl}" style="color:#05015A;text-decoration:none;">${resetUrl}</a>
        </p>
      </div>

      <!-- Expiry Warning -->
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;">
           <strong>Important:</strong> This link expires in <strong>15 minutes</strong>
        </p>
      </div>

      <!-- Security Note -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;">
           <strong>Didn't request this?</strong> You can safely ignore this email — your password won't change.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        For security reasons, never share this link with anyone.
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

export default passwordResetTemplate;