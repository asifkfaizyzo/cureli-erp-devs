// ============================================
// PASSWORD RESET EMAIL TEMPLATE
// ============================================

export function passwordResetTemplate(context) {
  const { recipientName, resetUrl } = context;

  const subject = 'Reset Your Password - Cureli';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">🔐 Reset Your Password</h1>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hi <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            You requested to reset your password for your Cureli account.
          </p>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Click the button below to reset your password:
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset Password
            </a>
          </div>

          <p style="color:#666;font-size:14px;">
            Or copy and paste this link into your browser:<br/>
            <a href="${resetUrl}" style="color:#05015A;word-break:break-all;">${resetUrl}</a>
          </p>

          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#92400e;font-size:14px;">
              <strong>⏰ This link will expire in 15 minutes.</strong>
            </p>
          </div>

          <p style="color:#666;font-size:14px;">
            If you didn't request this, please ignore this email. Your password will remain unchanged.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default passwordResetTemplate;