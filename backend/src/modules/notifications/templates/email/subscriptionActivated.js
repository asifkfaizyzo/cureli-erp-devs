// ============================================
// SUBSCRIPTION ACTIVATED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function subscriptionActivatedTemplate(context) {
  const {
    recipientName,
    shop_name,
    plan_name,
    start_date,
    end_date,
  } = context;

  const subject = '✅ Subscription Activated - Welcome to Cureli!';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Activated - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#059669 0%,#047857 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:24px;font-weight:600;">🎉 Welcome to Cureli!</h1>
      <p style="margin:8px 0 0;font-size:14px;opacity:0.95;">Your subscription is now active</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Great news! Your subscription for <strong style="color:#05015A;">${shop_name || 'your shop'}</strong> has been successfully activated. 🎊
      </p>

      <!-- Subscription Details -->
      <div style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border:1px solid #10b981;border-radius:10px;padding:20px;margin:24px 0;">
        <h3 style="margin:0 0 12px;font-size:13px;color:#065f46;text-transform:uppercase;letter-spacing:0.5px;">Subscription Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          ${plan_name ? `
          <tr>
            <td style="padding:8px 0;color:#065f46;font-size:13px;width:100px;">Plan</td>
            <td style="padding:8px 0;font-weight:600;color:#065f46;font-size:14px;">${plan_name}</td>
          </tr>
          ` : ''}
          ${start_date ? `
          <tr>
            <td style="padding:8px 0;color:#065f46;font-size:13px;">Start Date</td>
            <td style="padding:8px 0;font-weight:600;color:#065f46;font-size:14px;">
              ${new Date(start_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
          </tr>
          ` : ''}
          ${end_date ? `
          <tr>
            <td style="padding:8px 0;color:#065f46;font-size:13px;">Valid Until</td>
            <td style="padding:8px 0;font-weight:600;color:#065f46;font-size:14px;">
              ${new Date(end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Features Access -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 10px;color:#05015A;font-size:14px;font-weight:600;">🚀 What's Next?</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.7;">
          <li>Access all Cureli ERP features</li>
          <li>Set up your inventory and products</li>
          <li>Manage sales and purchases</li>
          <li>Generate reports and analytics</li>
        </ul>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.6;margin:20px 0;text-align:center;">
        You now have full access to all features. Let's get started! 🎯
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
          🏪 Go to Dashboard
        </a>
      </div>

      <!-- Help Section -->
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:12px 16px;margin:24px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;">
          💡 <strong>Need help getting started?</strong> Check our documentation or contact support anytime.
        </p>
      </div>

      <p style="font-size:13px;color:#888;text-align:center;margin:20px 0 0;line-height:1.5;">
        Questions? We're here to help at <a href="mailto:support@cureli.com" style="color:#05015A;text-decoration:none;font-weight:500;">support@cureli.com</a>
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

export default subscriptionActivatedTemplate;