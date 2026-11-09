import nodemailer from "nodemailer";

import { env } from "../config/env";
import {
  INQUIRY_SERVICE_LABELS,
  type InquiryService,
} from "../database/models/inquiry.model";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export async function sendInquiryOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Your PRIC verification code",
    text: `Your PRIC verification code is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `
      <div style="background:#000;padding:32px 16px;font-family:Arial,sans-serif">
        <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #b9822a;border-radius:16px;padding:32px;color:#fff;text-align:center">
          <h1 style="margin:0 0 16px;color:#f4d587;letter-spacing:2px">PRIC</h1>
          <p style="margin:0 0 20px;line-height:1.5">Use this code to verify your email for your inquiry.</p>
          <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:10px;color:#f4d587">${esc(code)}</p>
          <p style="margin:0;font-size:12px;color:#aaa">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>`,
  });
}

type InquiryMail = {
  service: InquiryService;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  id: string;
};

export async function sendInquiryNotification(i: InquiryMail) {
  const label = INQUIRY_SERVICE_LABELS[i.service];
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#aaa;vertical-align:top">${k}</td><td style="padding:6px 0;color:#fff">${v}</td></tr>`;

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: env.MARKETING_EMAIL,
    replyTo: i.email,
    subject: `[PRIC] New ${label} inquiry from ${i.fullName}`,
    text: `Service: ${label}\nName: ${i.fullName}\nEmail: ${i.email} (verified)\nPhone: ${i.phone}\n\n${i.message}\n\nReference: ${i.id}`,
    html: `
      <div style="background:#000;padding:32px 16px;font-family:Arial,sans-serif">
        <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #b9822a;border-radius:16px;padding:32px;color:#fff">
          <h2 style="margin:0 0 16px;color:#f4d587">New inquiry: ${esc(label)}</h2>
          <table style="border-collapse:collapse;font-size:14px">
            ${row("Name", esc(i.fullName))}
            ${row("Email", `${esc(i.email)} (verified)`)}
            ${row("Phone", esc(i.phone))}
            ${row("Message", esc(i.message).replace(/\n/g, "<br>"))}
            ${row("Reference", esc(i.id))}
          </table>
          <p style="margin:20px 0 0;font-size:12px;color:#aaa">Reply to this email to respond to the inquirer.</p>
        </div>
      </div>`,
  });
}