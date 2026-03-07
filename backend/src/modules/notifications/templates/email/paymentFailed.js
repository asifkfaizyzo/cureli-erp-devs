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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:22px;font-weight:600;">❌ Payment Failed</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:13px;">Action Required</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 16px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <!-- Alert Box -->
      <div style="background:#fef2f2;border:2px solid #dc2626;padding:18px;border-radius:10px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-size:16px;font-weight:700;color:#dc2626;">
          ❌ Your payment could not be processed
        </p>
      </div>

      <!-- Payment Details -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:100px;">Shop</td>
            <td style="padding:12px 16px;color:#1f2937;font-weight:500;font-size:14px;border-bottom:1px solid #e5e7eb;">${shopName}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Plan</td>
            <td style="padding:12px 16px;color:#1f2937;font-weight:500;font-size:14px;border-bottom:1px solid #e5e7eb;">${plan_name || 'Standard'}</td>
          </tr>
          ${amount ? `
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Amount</td>
            <td style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;">₹${Number(amount).toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Status</td>
            <td style="padding:12px 16px;">
              <span style="background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;">FAILED</span>
            </td>
          </tr>
        </table>
      </div>

      ${error_message ? `
      <!-- Error Reason -->
      <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:12px 16px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#991b1b;font-size:13px;">
          <strong>Reason:</strong> ${error_message}
        </p>
      </div>
      ` : ''}

      <p style="font-size:14px;color:#555;line-height:1.6;margin:20px 0;">
        Don't worry! Payment failures can happen due to insufficient funds, card limits, or temporary bank issues.
      </p>

      <!-- Action Steps -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 10px;font-weight:600;color:#05015A;font-size:13px;">💡 What you can do:</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.7;">
          <li>Check your card/bank account balance</li>
          <li>Try a different payment method</li>
          <li>Contact your bank if the issue persists</li>
          <li>Retry the payment below</li>
        </ul>
      </div>

      <!-- Retry Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${retry_url || FRONTEND_URL + '/subscription'}" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
          🔄 Retry Payment
        </a>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Need help? Contact us at <a href="mailto:support@cureli.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@cureli.com</a>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:40px;opacity:0.5;margin-bottom:10px;"/>
      <p style="margin:0 0 6px;color:#d1d5db;">© ${new Date().getFullYear()} <strong>Cureli</strong> ERP</p>
      <p style="margin:0;">All rights reserved</p>
    </div>

  </div>
</body>
</html>
  `;

  return { subject, html };
}

export default paymentFailedTemplate;