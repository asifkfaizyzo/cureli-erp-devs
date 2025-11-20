import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail(to, subject, html) {
  await mailer.sendMail({
    from: `"Cureli ERP" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
