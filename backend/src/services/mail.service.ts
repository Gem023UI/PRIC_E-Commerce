import nodemailer from "nodemailer";

import { env } from "../src/config/env";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  url: string,
) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Verify your PRIC account",
    text: `Hi ${firstName},\n\nVerify your email to activate your PRIC account:\n${url}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this email.`,
    html: `
      <div style="background:#000;padding:32px 16px;font-family:Arial,sans-serif">
        <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #b9822a;border-radius:16px;padding:32px;color:#fff">
          <h1 style="margin:0 0 8px;color:#f4d587;letter-spacing:2px">PRIC</h1>
          <p style="margin:0 0 16px">Hi ${escapeHtml(firstName)},</p>
          <p style="margin:0 0 24px;line-height:1.5">Verify your email address to activate your account.</p>
          <a href="${url}" style="display:inline-block;padding:12px 28px;border-radius:999px;background:linear-gradient(135deg,#fde7a0,#c8933a,#a8731f);color:#2a1802;font-weight:700;text-decoration:none">Verify email</a>
          <p style="margin:24px 0 0;font-size:12px;color:#aaa">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        </div>
      </div>`,
  });
}