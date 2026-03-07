// ============================================
// EMAIL CHANGED NOTIFICATION TEMPLATE
// ============================================

export function emailChangedTemplate(context) {
  const { recipientName, old_email, new_email, notification_type } = context;

  const isOldEmail = notification_type === 'old_email';

  const subject = isOldEmail 
    ? 'Email Address Changed - Cureli Health' 
    : 'Welcome to Cureli Health - Email Verified';

  const content = isOldEmail
    ? `
      <p style="font-size:15px;color:#444;line-height:1.6;">
        Your email address has been changed from <strong>${old_email}</strong> to <strong>${new_email}</strong>.
      </p>
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#991b1b;font-size:14px;">
          <strong> If you did not make this change, please contact support immediately.</strong>
        </p>
      </div>
    `
    : `
      <p style="font-size:15px;color:#444;line-height:1.6;">
        Your email has been successfully changed to this address.
      </p>
      <p style="font-size:15px;color:#444;line-height:1.6;">
        You will now receive all communications at this email.
      </p>
    `;

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isOldEmail ? 'Email Changed' : 'Email Verified'} - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;">${isOldEmail ? ' Email Changed' : ' Email Verified'}</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Account Notification</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 16px;">
        Hi <strong style="color:#05015A;">${recipientName || 'there'}</strong>,
      </p>
      
      <div style="font-size:14px;color:#555;line-height:1.7;">
        ${content}
      </div>

      <!-- Info Box -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;">
           <strong>Security Tip:</strong> If you didn't make this change, please contact support immediately.
        </p>
      </div>

      <!-- Help Note -->
      <p style="font-size:13px;color:#888;margin:20px 0 0;line-height:1.5;text-align:center;">
        Questions? Contact us at <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
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

export default emailChangedTemplate;