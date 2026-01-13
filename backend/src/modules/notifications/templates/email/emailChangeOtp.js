// ============================================
// EMAIL CHANGE OTP TEMPLATE
// ============================================

export function emailChangeOtpTemplate(context) {
  const { recipientName, otp, expires_in_minutes = 10 } = context;

  const subject = 'Verify Your New Email - Cureli';

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
          <h1 style="margin:0;font-size:24px;">✉️ Verify Your New Email</h1>
        </div>

        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hi <strong>${recipientName || 'there'}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            You requested to change your email address to this one.
          </p>
          
          <p style="font-size:15px;color:#444;">Your verification code is:</p>

          <div style="text-align:center;margin:30px 0;">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#05015A;">${otp}</span>
          </div>

          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#92400e;font-size:14px;">
              This code expires in <strong>${expires_in_minutes} minutes</strong>.
            </p>
          </div>

          <p style="color:#666;font-size:14px;">
            If you didn't request this, please ignore this email.
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

export default emailChangeOtpTemplate;