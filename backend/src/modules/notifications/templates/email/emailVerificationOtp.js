// ============================================
// EMAIL VERIFICATION OTP TEMPLATE
// ============================================

export function emailVerificationOtpTemplate(context) {
  const { recipientName, otp, expires_in_minutes = 5 } = context;

  const subject = 'Your Cureli Health Verification Code';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Email Verification</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Verify Your Account</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName || 'there'}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">
        Please use the verification code below to complete your email verification:
      </p>

      <!-- OTP Code Box -->
      <div style="background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);border:2px dashed #05015A;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
        <h1 style="color:#05015A;letter-spacing:10px;margin:0;font-size:38px;font-weight:700;font-family:'Courier New',monospace;">
          ${otp}
        </h1>
      </div>

      <!-- Expiry Notice -->
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;text-align:center;">
          ⏰ This code expires in <strong>${expires_in_minutes} minutes</strong>
        </p>
      </div>

      <!-- Security Info -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;">
          🔒 Keep this code secure and don't share it with anyone.
        </p>
      </div>

      <p style="color:#888;font-size:13px;text-align:center;margin:20px 0 0;line-height:1.5;">
        If you didn't request this verification code, please ignore this email.
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

export default emailVerificationOtpTemplate;