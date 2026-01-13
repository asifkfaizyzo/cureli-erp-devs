// ============================================
// PAYMENT FAILED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function paymentFailedTemplate(context) {
  const { 
    recipientName, 
    shop_name, 
    business_name,
    plan_name,
    amount,
    error_message,
    retry_url
  } = context;
  
  const shopName = shop_name || business_name || 'your shop';

  const subject = '❌ Payment Failed - Action Required - Cureli';

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
        <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;">❌ Payment Failed</h1>
          <p style="margin:12px 0 0;opacity:0.9;font-size:16px;">Action required</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <div style="background:#fef2f2;border:2px solid #dc2626;padding:20px;border-radius:8px;margin:20px 0;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#dc2626;">
              ❌ Your payment could not be processed
            </p>
          </div>

          <table style="width:100%;border-collapse:collapse;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:20px 0;">
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Shop</td>
              <td style="padding:12px 16px;color:#1f2937;font-weight:500;border-bottom:1px solid #e5e7eb;">${shopName}</td>
            </tr>
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Plan</td>
              <td style="padding:12px 16px;color:#1f2937;font-weight:500;border-bottom:1px solid #e5e7eb;">${plan_name || 'Standard'}</td>
            </tr>
            ${amount ? `
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Amount</td>
              <td style="padding:12px 16px;color:#1f2937;font-weight:500;border-bottom:1px solid #e5e7eb;">₹${Number(amount).toLocaleString('en-IN')}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;">Status</td>
              <td style="padding:12px 16px;">
                <span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;">Failed</span>
              </td>
            </tr>
          </table>

          ${error_message ? `
          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#991b1b;font-size:14px;">
              <strong>Reason:</strong> ${error_message}
            </p>
          </div>
          ` : ''}

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Don't worry! This can happen due to various reasons such as insufficient funds, 
            card limits, or temporary bank issues.
          </p>

          <p style="font-size:15px;color:#444;line-height:1.6;font-weight:600;">
            What you can do:
          </p>
          <ul style="color:#4b5563;padding-left:20px;line-height:1.8;">
            <li>Check your card/bank account balance</li>
            <li>Try a different payment method</li>
            <li>Contact your bank if the issue persists</li>
            <li>Retry the payment using the button below</li>
          </ul>

          <div style="text-align:center;margin:32px 0;">
            <a href="${retry_url || FRONTEND_URL + '/subscription'}" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Retry Payment →
            </a>
          </div>

          <p style="font-size:14px;color:#6b7280;text-align:center;">
            Need help? Contact our support team.
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

export default paymentFailedTemplate;