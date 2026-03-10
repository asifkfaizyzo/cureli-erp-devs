// ============================================
// SUBSCRIPTION PAYMENT REMINDER EMAIL TEMPLATE
// Manual reminder sent by CAdmin
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionPaymentReminderTemplate(context) {
  const {
    recipientName,
    shop_name,
    plan_name,
    plan_price,
    end_date,
    grace_period_until,
    days_remaining,
    is_in_grace,
  } = context;

  const urgencyColor = days_remaining <= 3 ? '#dc2626' : '#f59e0b';
  const urgencyBg = days_remaining <= 3 ? '#fef2f2' : '#fef3c7';
  
  const statusText = is_in_grace 
    ? `Your subscription is in grace period` 
    : `Your subscription expires in ${days_remaining} days`;

  const deadlineDate = is_in_grace ? grace_period_until : end_date;

  const subject = is_in_grace
    ? ` Action Required: Complete payment to avoid suspension`
    : ` Payment Reminder: Renew your subscription`;

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Payment Reminder</h1>
      <p style="margin:8px 0 0;font-size:13px;opacity:0.9;">${statusText}</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        This is a friendly reminder from the <strong>Cureli Health</strong> team about your subscription for <strong style="color:#05015A;">${shop_name || 'your shop'}</strong>.
      </p>

      <!-- Subscription Details Box -->
      <div style="background:${urgencyBg};border:2px solid ${urgencyColor};border-radius:10px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 14px;font-size:13px;color:${urgencyColor};text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-bottom:1px solid ${urgencyColor}40;padding-bottom:8px;">
          Subscription Details
        </h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;width:130px;">Plan</td>
            <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#111827;">${plan_name || 'Standard'}</td>
          </tr>
          ${plan_price ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Amount Due</td>
            <td style="padding:8px 0;font-weight:700;font-size:16px;text-align:right;color:${urgencyColor};">₹${Number(plan_price).toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">${is_in_grace ? 'Grace Ends' : 'Expires On'}</td>
            <td style="padding:8px 0;font-weight:700;font-size:14px;text-align:right;color:${urgencyColor};">
              ${deadlineDate ? new Date(deadlineDate).toLocaleDateString('en-IN', { 
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
              }) : 'Soon'}
            </td>
          </tr>
          ${days_remaining !== null ? `
          <tr>
            <td style="padding:8px 0;color:#6b7280;font-size:13px;">Time Left</td>
            <td style="padding:8px 0;font-weight:700;font-size:17px;text-align:right;color:${urgencyColor};">${days_remaining} days</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${is_in_grace ? `
      <!-- Grace Period Warning -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.6;">
           <strong>Critical:</strong> Your account is in grace period. If payment is not received before the deadline, your subscription will be <strong>suspended</strong> and you will lose access to all Cureli Health services.
        </p>
      </div>
      ` : ''}

      <!-- Action Required -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;line-height:1.6;">
           <strong>Action Required:</strong> Complete your payment to ensure uninterrupted access to all Cureli health features and services.
        </p>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.6;margin:20px 0;text-align:center;">
        Please complete your payment at your earliest convenience.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/settings/upgrade" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
           Complete Payment
        </a>
      </div>

      <!-- Help Section -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;">
           <strong>Need Help?</strong> Our support team is ready to assist you with any payment questions.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Contact us at <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> Health</p>
      <p style="margin:0;font-size:11px;">This is an automated reminder. Please do not reply to this email.</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default subscriptionPaymentReminderTemplate;