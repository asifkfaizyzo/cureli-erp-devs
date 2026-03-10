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

  const subject = ' Payment Successful - Cureli';

  const formattedAmount = amount
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
    : 'N/A';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#059669 0%,#047857 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;"> Payment Successful</h1>
      <p style="margin:12px 0 0;font-size:32px;font-weight:700;letter-spacing:-1px;">${formattedAmount}</p>
      <p style="margin:4px 0 0;opacity:0.9;font-size:13px;">Thank you for your payment</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Your payment has been processed successfully! Here are your transaction details:
      </p>

      <!-- Payment Details -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:120px;">Shop</td>
            <td style="padding:12px 16px;font-weight:600;font-size:14px;color:#1f2937;border-bottom:1px solid #e5e7eb;">${shop_name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Amount Paid</td>
            <td style="padding:12px 16px;font-weight:700;font-size:16px;color:#059669;border-bottom:1px solid #e5e7eb;">${formattedAmount}</td>
          </tr>
          ${plan_name ? `
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Plan</td>
            <td style="padding:12px 16px;font-weight:600;font-size:14px;color:#1f2937;border-bottom:1px solid #e5e7eb;">${plan_name}</td>
          </tr>
          ` : ''}
          ${transaction_id ? `
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Transaction ID</td>
            <td style="padding:12px 16px;font-family:'Courier New',monospace;font-size:12px;color:#374151;border-bottom:1px solid #e5e7eb;">${transaction_id}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Payment Date</td>
            <td style="padding:12px 16px;font-size:13px;color:#374151;">${payment_date ? new Date(payment_date).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : new Date().toLocaleDateString('en-IN')}</td>
          </tr>
        </table>
      </div>

      <!-- Success Note -->
      <div style="background:#f0fdf4;border-left:4px solid #059669;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#065f46;font-size:13px;">
           <strong>Receipt Generated:</strong> A receipt has been sent to your email for your records.
        </p>
      </div>

      <!-- Info Box -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#05015A;font-size:13px;">
           You can view your complete payment history and subscription details in your dashboard.
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/subscription" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
           View Subscription
        </a>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Questions about your payment? Contact us at <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
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

export default paymentSuccessTemplate;