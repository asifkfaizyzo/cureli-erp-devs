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
    ? `⚠️ Action Required: Complete payment to avoid suspension`
    : `💳 Payment Reminder: Renew your subscription`;

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
          <h1 style="margin:0;font-size:24px;">💳 Payment Reminder</h1>
          <p style="margin:12px 0 0;font-size:14px;opacity:0.9;">${statusText}</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            This is a friendly reminder from the Cureli ERP team about your subscription for 
            <strong>${shop_name || 'your shop'}</strong>.
          </p>

          <!-- Subscription Details Box -->
          <div style="background:${urgencyBg};border:1px solid ${urgencyColor}40;border-radius:8px;padding:20px;margin:24px 0;">
            <h3 style="margin:0 0 16px;font-size:14px;color:${urgencyColor};text-transform:uppercase;">
              Subscription Details
            </h3>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Plan:</td>
                <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;">${plan_name || 'Standard'}</td>
              </tr>
              ${plan_price ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Amount Due:</td>
                <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:${urgencyColor};">₹${Number(plan_price).toLocaleString('en-IN')}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">${is_in_grace ? 'Grace Period Ends:' : 'Expires On:'}</td>
                <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:${urgencyColor};">
                  ${deadlineDate ? new Date(deadlineDate).toLocaleDateString('en-IN', { 
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                  }) : 'Soon'}
                </td>
              </tr>
              ${days_remaining !== null ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Days Remaining:</td>
                <td style="padding:8px 0;font-weight:700;font-size:16px;text-align:right;color:${urgencyColor};">${days_remaining} days</td>
              </tr>
              ` : ''}
            </table>
          </div>

          ${is_in_grace ? `
          <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#dc2626;font-size:14px;">
              <strong>⚠️ Important:</strong> Your account is currently in grace period. 
              If payment is not received before the deadline, your subscription will be suspended 
              and you will lose access to all services.
            </p>
          </div>
          ` : ''}

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Please complete your payment at your earliest convenience to ensure uninterrupted access 
            to all features and services.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/settings/upgrade" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Complete Payment →
            </a>
          </div>

          <p style="font-size:13px;color:#666;text-align:center;margin-top:24px;">
            Need help? Contact our support team at 
            <a href="mailto:support@cureli.in" style="color:#05015A;">support@cureli.in</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
          <p style="margin:8px 0 0;font-size:11px;">
            This is an automated reminder. Please do not reply to this email.
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default subscriptionPaymentReminderTemplate;