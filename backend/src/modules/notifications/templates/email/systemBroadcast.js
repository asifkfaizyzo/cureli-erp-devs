// ============================================
// SYSTEM BROADCAST EMAIL TEMPLATE
// ============================================

export function systemBroadcastTemplate(context) {
  const {
    recipientName,
    subject: broadcastSubject,
    message,
    sender_name = 'Cureli Health Team',
  } = context;

  const subject = broadcastSubject || 'Important Announcement from Cureli Health';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Announcement - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Important Announcement</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">From the Cureli  Health</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <!-- Announcement Message -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:20px;margin:20px 0;border-radius:0 10px 10px 0;">
        <div style="font-size:14px;color:#1e3a5f;line-height:1.7;white-space:pre-wrap;">${message}</div>
      </div>

      <!-- Signature -->
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="font-size:14px;color:#666;margin:0 0 6px;">Best regards,</p>
        <p style="font-size:15px;color:#05015A;margin:0;font-weight:600;">${sender_name}</p>
        <p style="font-size:12px;color:#9ca3af;margin:4px 0 0;">Cureli Health</p>
      </div>

      <!-- Contact Info -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;">
           Questions? Contact us at <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> Health</p>
      <p style="margin:0;color:#6b7280;font-size:11px;">This is a system announcement. Please do not reply to this email.</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default systemBroadcastTemplate;