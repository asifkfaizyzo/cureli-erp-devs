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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#059669 0%,#047857 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:28px;">🎉 Welcome!</h1>
          <p style="margin:12px 0 0;font-size:16px;">Your subscription is now active</p>
        </div>

        <!-- Content -->
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hello <strong>${recipientName}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Great news! Your subscription for <strong>${shop_name || 'your shop'}</strong> has been activated successfully.
          </p>

          <div style="background:#d1fae5;border:1px solid #10b981;border-radius:8px;padding:20px;margin:20px 0;">
            <table style="width:100%;border-collapse:collapse;">
              ${plan_name ? `
              <tr>
                <td style="padding:8px 0;color:#065f46;">Plan:</td>
                <td style="padding:8px 0;font-weight:600;color:#065f46;">${plan_name}</td>
              </tr>
              ` : ''}
              ${start_date ? `
              <tr>
                <td style="padding:8px 0;color:#065f46;">Started:</td>
                <td style="padding:8px 0;font-weight:600;color:#065f46;">
                  ${new Date(start_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
              ` : ''}
              ${end_date ? `
              <tr>
                <td style="padding:8px 0;color:#065f46;">Valid until:</td>
                <td style="padding:8px 0;font-weight:600;color:#065f46;">
                  ${new Date(end_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <p style="font-size:15px;color:#444;line-height:1.6;">
            You now have full access to all features. Let's get started!
          </p>

          <div style="text-align:center;margin:32px 0;">
            <a href="${FRONTEND_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              Go to Dashboard →
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

export default subscriptionActivatedTemplate;