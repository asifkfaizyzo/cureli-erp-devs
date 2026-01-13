// ============================================
// PAYMENT SUCCESS EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function paymentSuccessTemplate(context) {
  const {
    recipientName,
    shop_name,
    amount,
    transaction_id,
    plan_name,
    payment_date,
  } = context;

  const subject = '✅ Payment Successful - Cureli';

  const formattedAmount = amount
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    : 'N/A';

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
        <div style="background:linear-gradient(135deg,#059669 0%,#047857 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">✅ Payment Successful</h1>
          <p style="margin:12px 0 0;font-size:28px;font-weight:bold;">${formattedAmount}</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Your payment has been processed successfully. Here are the details:
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Shop:</td>
                <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #e5e7eb;">${shop_name || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Amount:</td>
                <td style="padding:8px 0;font-weight:600;color:#059669;border-bottom:1px solid #e5e7eb;">${formattedAmount}</td>
              </tr>
              ${plan_name ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Plan:</td>
                <td style="padding:8px 0;font-weight:600;border-bottom:1px solid #e5e7eb;">${plan_name}</td>
              </tr>
              ` : ''}
              ${transaction_id ? `
              <tr>
                <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;">Transaction ID:</td>
                <td style="padding:8px 0;font-family:monospace;font-size:13px;border-bottom:1px solid #e5e7eb;">${transaction_id}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding:8px 0;color:#6b7280;">Date:</td>
                <td style="padding:8px 0;">${payment_date ? new Date(payment_date).toLocaleDateString('en-IN', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : new Date().toLocaleDateString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <p style="font-size:14px;color:#666;line-height:1.6;">
            A receipt has been generated for your records. You can view your payment history in your dashboard.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              View Subscription →
            </a>
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

export default paymentSuccessTemplate;