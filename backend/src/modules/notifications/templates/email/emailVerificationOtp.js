// ============================================
// EMAIL VERIFICATION OTP TEMPLATE
// ============================================

export function emailVerificationOtpTemplate(context) {
  const { recipientName, otp, expires_in_minutes = 5 } = context;

  const subject = 'Your Cureli Verification Code';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        
        <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">🔐 Email Verification</h1>
        </div>

        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName || 'there'}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Your verification code is:
          </p>

          <div style="background:#f5f5f5;padding:20px;text-align:center;margin:20px 0;border-radius:8px;">
            <h1 style="color:#05015A;letter-spacing:8px;margin:0;font-size:36px;">${otp}</h1>
          </div>

          <p style="color:#666;font-size:14px;text-align:center;">
            This code will expire in <strong>${expires_in_minutes} minutes</strong>.
          </p>

          <p style="color:#999;font-size:12px;text-align:center;margin-top:24px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>

        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default emailVerificationOtpTemplate;