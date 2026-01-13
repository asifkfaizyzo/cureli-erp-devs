// ============================================
// CADMIN PASSWORD RESET EMAIL TEMPLATE
// ============================================

export function cadminPasswordResetTemplate(context) {
  const { recipientName, resetUrl } = context;

  const subject = 'Reset Your Cureli Admin Password';

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
          <div style="margin-bottom:10px;">
            <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="cureli white" border="0" style="width:80px;"/>
          </div>
          <h1 style="margin:0;font-size:24px;">Cureli Admin Panel</h1>
          <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Secure Access Management</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <h2 style="color:#05015A;font-size:22px;margin:0 0 16px;">Reset Your Password</h2>

          <p style="font-size:15px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            We received a request to reset your password for your Cureli Admin account.
            If this was you, use the button below to choose a new password.
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
              Reset Password
            </a>
          </div>

          <p style="font-size:14px;color:#666;line-height:1.6;">
            If the button doesn't work, copy and paste the following link into your browser:
          </p>

          <p style="word-break:break-all;font-size:14px;color:#05015A;">
            <a href="${resetUrl}" style="color:#05015A;text-decoration:none;">${resetUrl}</a>
          </p>

          <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#92400e;font-size:13px;">
              <strong>This link will expire in 15 minutes.</strong>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0 0 8px;">This email was sent from the Cureli Admin Panel.</p>
          <p style="margin:0;">If you did not request this password reset, you can safely ignore this email.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default cadminPasswordResetTemplate;