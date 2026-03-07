// ============================================
// SUBSCRIPTION GRACE EXTENDED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionGraceExtendedTemplate(context) {
  const {
    recipientName,
    shop_name,
    plan_name,
    days_extended,
    previous_grace_end,
    new_grace_end,
    reason,
  } = context;

  const subject = ` Good News: Your grace period has been extended`;

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grace Period Extended - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Grace Period Extended</h1>
      <p style="margin:12px 0 0;font-size:36px;font-weight:700;letter-spacing:-1px;">+${days_extended} days</p>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Additional Time Granted</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Great news! Your grace period for <strong style="color:#05015A;">${shop_name || 'your shop'}</strong> has been extended by the <strong>Cureli Health</strong> support team.
      </p>

      <!-- Extension Details -->
      <div style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);border:1px solid #6ee7b7;border-radius:10px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 14px;font-size:13px;color:#065f46;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #a7f3d0;padding-bottom:8px;">Extension Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${plan_name ? `
          <tr>
            <td style="padding:8px 0;color:#065f46;font-size:13px;width:130px;">Plan</td>
            <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#065f46;">${plan_name}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:8px 0;color:#065f46;font-size:13px;">Extended By</td>
            <td style="padding:8px 0;font-weight:700;font-size:16px;text-align:right;color:#059669;">+${days_extended} days</td>
          </tr>
          ${previous_grace_end ? `
          <tr>
            <td style="padding:8px 0;color:#065f46;font-size:13px;">Old Deadline</td>
            <td style="padding:8px 0;font-size:13px;text-align:right;text-decoration:line-through;color:#9ca3af;">
              ${new Date(previous_grace_end).toLocaleDateString('en-IN', { 
                year: 'numeric', month: 'short', day: 'numeric' 
              })}
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:8px 0;color:#065f46;font-size:13px;">New Deadline</td>
            <td style="padding:8px 0;font-weight:700;font-size:15px;text-align:right;color:#059669;">
              ${new_grace_end ? new Date(new_grace_end).toLocaleDateString('en-IN', { 
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
              }) : 'Extended'} 
            </td>
          </tr>
        </table>
      </div>

      ${reason ? `
      <!-- Support Note -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 6px;color:#05015A;font-size:13px;font-weight:600;"> Note from Cureli Health Support:</p>
        <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;font-style:italic;">
          "${reason}"
        </p>
      </div>
      ` : ''}

      <p style="font-size:14px;color:#555;line-height:1.6;margin:20px 0;">
        Please use this additional time to complete your payment and maintain uninterrupted access to <strong>Cureli Health</strong>.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/settings/upgrade" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
           Complete Payment Now
        </a>
      </div>

      <!-- Reminder Warning -->
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
           <strong>Important Reminder:</strong> This extension is a one-time courtesy. Please ensure payment is completed before the new deadline to maintain your Cureli Health subscription.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Need help? Contact us at <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
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

export default subscriptionGraceExtendedTemplate;