// ============================================
// SUBSCRIPTION RENEWED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionRenewedTemplate(context) {
  const { 
    recipientName, 
    shop_name, 
    business_name,
    plan_name,
    new_end_date,
    amount_paid 
  } = context;
  
  const shopName = shop_name || business_name || 'your shop';
  
  const endDateFormatted = new_end_date
    ? new Date(new_end_date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const subject = ' Subscription Renewed Successfully - Cureli Health';

  const html = `
   <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Renewal Successful - Cureli Health</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:24px;font-weight:600;"> Renewal Successful!</h1>
      <p style="margin:8px 0 0;opacity:0.95;font-size:14px;">Your subscription has been renewed</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 16px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <!-- Success Banner -->
      <div style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border:2px solid #10b981;padding:20px;border-radius:10px;margin:20px 0;text-align:center;">
        <p style="margin:0;font-size:18px;font-weight:700;color:#065f46;">
           Subscription Renewed Successfully!
        </p>
      </div>

      <!-- Renewal Details -->
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:24px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;width:120px;">Shop</td>
            <td style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;">${shopName}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Plan</td>
            <td style="padding:12px 16px;color:#1f2937;font-weight:600;font-size:14px;border-bottom:1px solid #e5e7eb;">${plan_name || 'Standard'}</td>
          </tr>
          ${amount_paid ? `
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #e5e7eb;">Amount Paid</td>
            <td style="padding:12px 16px;color:#059669;font-weight:700;font-size:15px;border-bottom:1px solid #e5e7eb;">₹${Number(amount_paid).toLocaleString('en-IN')}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding:12px 16px;color:#6b7280;font-size:13px;">Valid Until</td>
            <td style="padding:12px 16px;color:#10b981;font-weight:700;font-size:14px;">${endDateFormatted}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.6;margin:20px 0;">
        Great news! Your <strong>Cureli Health</strong> subscription for <strong style="color:#05015A;">${shopName}</strong> has been renewed successfully. You'll continue to have uninterrupted access to all features. 
      </p>

      <!-- Benefits Box -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 8px;color:#05015A;font-size:13px;font-weight:600;"> Continue Enjoying:</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:12px;line-height:1.6;">
          <li>Full access to all Cureli Health features</li>
          <li>Uninterrupted service and support</li>
          <li>Regular updates and improvements</li>
          <li>Comprehensive reports and analytics</li>
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(16,185,129,0.3);">
           Continue to Dashboard
        </a>
      </div>

      <!-- Thank You -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;text-align:center;">
           <strong>Thank you for your continued trust in Cureli Health!</strong>
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Questions? We're here to help at <a href="mailto:support@curelihealth.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@curelihealth.com</a>
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

export default subscriptionRenewedTemplate;