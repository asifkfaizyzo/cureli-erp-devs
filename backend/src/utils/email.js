//Q:\YourZeroesAndOnes\cureli\curely_erp\backend\src\utils\email.js
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
    from: `"Cureli Health" <info@curelihealth.com>`,
    to,
    subject,
    html,
  });
}
