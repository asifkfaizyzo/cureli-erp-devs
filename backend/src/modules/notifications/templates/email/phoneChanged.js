// ============================================
// PHONE CHANGED NOTIFICATION TEMPLATE
// ============================================

export function phoneChangedTemplate(context) {
  const { recipientName, old_phone, new_phone } = context;

  const subject = 'Phone Number Changed - Cureli';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f4f6fb;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        
        <div style="background:linear-gradient(135deg,#05015A 0%,#0a0280 100%);color:white;padding:32px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;font-size:24px;">📱 Phone Number Changed</h1>
        </div>

        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;">
          <p style="font-size:16px;color:#333;">Hi <strong>${recipientName || 'there'}</strong>,</p>
          
          <p style="font-size:15px;color:#444;line-height:1.6;">
            Your phone number has been changed from <strong>${old_phone}</strong> to <strong>${new_phone}</strong>.
          </p>

          <div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0;color:#991b1b;font-size:14px;">
              <strong>If you did not make this change, please contact support immediately.</strong>
            </p>
          </div>
        </div>

        <div style="background:#1f2937;color:#9ca3af;padding:24px;text-align:center;font-size:12px;border-radius:0 0 12px 12px;">
          <p style="margin:0;">© ${new Date().getFullYear()} Cureli ERP. All rights reserved.</p>
        </div>

      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

export default phoneChangedTemplate;