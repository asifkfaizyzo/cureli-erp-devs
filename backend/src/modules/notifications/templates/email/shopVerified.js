// ============================================
// SHOP VERIFIED EMAIL TEMPLATE
// ============================================

const FRONTEND_URL = process.env.USER_FRONTEND_URL || 'http://localhost:5173';

export function shopVerifiedTemplate(context) {
  const { recipientName, shop_name, business_name } = context;
  const shopName = shop_name || business_name || 'your shop';

  const subject = 'Congratulations! Your shop is verified - Cureli';

  const html = `
    <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Complete - Cureli</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
      <img src="https://i.ibb.co/M5GxgMSr/cureli-white.png" alt="Cureli" style="width:70px;margin-bottom:12px;"/>
      <h1 style="margin:0;font-size:24px;font-weight:600;">🎉 Verification Complete!</h1>
      <p style="margin:8px 0 0;opacity:0.9;font-size:14px;">Your shop is now verified</p>
    </div>

    <!-- Content -->
    <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
      
      <p style="font-size:15px;color:#333;margin:0 0 12px;">
        Hello <strong style="color:#05015A;">${recipientName}</strong>,
      </p>
      
      <p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 20px;">
        Great news! Your shop <strong style="color:#05015A;">${shopName}</strong> has been successfully verified by our team. All your documents have been approved! 🎊
      </p>

      <!-- Success Box -->
      <div style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border-left:4px solid #10b981;padding:20px;margin:24px 0;border-radius:0 10px 10px 0;text-align:center;">
        <p style="margin:0;color:#065f46;font-weight:700;font-size:16px;">
          ✅ Your shop is now fully operational!
        </p>
      </div>

      <!-- Features Box -->
      <div style="background:#f0f9ff;border-left:4px solid #05015A;padding:16px 20px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0 0 10px;color:#05015A;font-size:14px;font-weight:600;">🚀 What's Next?</p>
        <ul style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.7;">
          <li>Access all Cureli ERP features</li>
          <li>Set up your inventory and products</li>
          <li>Configure your shop settings</li>
          <li>Start managing your business efficiently</li>
        </ul>
      </div>

      <p style="font-size:14px;color:#555;line-height:1.6;margin:20px 0;text-align:center;">
        You can now access the complete <strong>Cureli ERP</strong> dashboard and unlock all features.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:28px 0;">
        <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#05015A,#0a0280);color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 3px 10px rgba(5,1,90,0.2);">
          🏪 Go to Dashboard
        </a>
      </div>

      <!-- Welcome Message -->
      <div style="background:#fef9e7;border-left:4px solid #f59e0b;padding:14px 18px;margin:24px 0;border-radius:0 10px 10px 0;">
        <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
          💡 <strong>Welcome to Cureli!</strong> Need help getting started? Check out our documentation or contact support anytime.
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

export default shopVerifiedTemplate;