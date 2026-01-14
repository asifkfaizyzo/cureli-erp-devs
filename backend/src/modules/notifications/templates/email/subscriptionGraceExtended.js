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

  const subject = `✅ Good News: Your grace period has been extended`;

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
        <div style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">✅ Grace Period Extended</h1>
          <p style="margin:12px 0 0;font-size:32px;font-weight:bold;">+${days_extended} days</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Great news! Your grace period for <strong>${shop_name || 'your shop'}</strong> has been 
            extended by our support team.
          </p>

          <!-- Extension Details -->
          <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:20px;margin:24px 0;">
            <table style="width:100%;border-collapse:collapse;">
              ${plan_name ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Plan:</td>
                <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;">${plan_name}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Extended By:</td>
                <td style="padding:8px 0;font-weight:600;font-size:14px;text-align:right;color:#059669;">${days_extended} days</td>
              </tr>
              ${previous_grace_end ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">Previous Deadline:</td>
                <td style="padding:8px 0;font-size:14px;text-align:right;text-decoration:line-through;color:#9ca3af;">
                  ${new Date(previous_grace_end).toLocaleDateString('en-IN', { 
                    year: 'numeric', month: 'short', day: 'numeric' 
                  })}
                </td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:8px 0;color:#6b7280;font-size:14px;">New Deadline:</td>
                <td style="padding:8px 0;font-weight:700;font-size:16px;text-align:right;color:#059669;">
                  ${new_grace_end ? new Date(new_grace_end).toLocaleDateString('en-IN', { 
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' 
                  }) : 'Extended'}
                </td>
              </tr>
            </table>
          </div>

          ${reason ? `
          <div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#0369a1;font-size:14px;">
              <strong>Note from Support:</strong><br/>
              ${reason}
            </p>
          </div>
          ` : ''}

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Please use this additional time to complete your payment and avoid any service interruption.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/settings/upgrade" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Complete Payment Now →
            </a>
          </div>

          <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#92400e;font-size:13px;">
              <strong>⏰ Remember:</strong> This extension is a one-time courtesy. 
              Please ensure payment is completed before the new deadline to maintain your subscription.
            </p>
          </div>
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

export default subscriptionGraceExtendedTemplate;