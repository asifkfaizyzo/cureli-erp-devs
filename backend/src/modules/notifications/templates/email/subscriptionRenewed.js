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

  const subject = '🔄 Subscription Renewed Successfully - Cureli';

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
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;">🔄 Renewal Successful!</h1>
          <p style="margin:12px 0 0;opacity:0.9;font-size:16px;">Your subscription has been renewed</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <div style="background:#d1fae5;border:2px solid #10b981;padding:20px;border-radius:8px;margin:20px 0;text-align:center;">
            <p style="margin:0;font-size:18px;font-weight:700;color:#065f46;">
              🔄 Subscription Renewed!
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
            ${amount_paid ? `
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;border-bottom:1px solid #e5e7eb;">Amount Paid</td>
              <td style="padding:12px 16px;color:#1f2937;font-weight:600;border-bottom:1px solid #e5e7eb;">₹${Number(amount_paid).toLocaleString('en-IN')}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding:12px 16px;color:#6b7280;font-size:14px;">New Expiry Date</td>
              <td style="padding:12px 16px;color:#10b981;font-weight:600;">${endDateFormatted}</td>
            </tr>
          </table>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            Great news! Your subscription for <strong>${shopName}</strong> has been renewed successfully. 
            You'll continue to have uninterrupted access to all features.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
              Continue to Dashboard →
            </a>
          </div>

          <p style="font-size:14px;color:#6b7280;text-align:center;">
            Thank you for your continued trust in Cureli ERP!
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

export default subscriptionRenewedTemplate;