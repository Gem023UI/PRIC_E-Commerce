import { toBuffer } from "qrcode";
import nodemailer from "nodemailer";

import { env } from "../config/env";
import {
  PAYMENT_LABELS,
  type OrderRecord,
  type PaymentMethod,
} from "../database/models/order.model";
import { trackingUrl } from "../utils/trackingCode";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const peso = (n: number) =>
  `PHP ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

export async function sendOrderOtpEmail(to: string, code: string) {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Your PRIC verification code",
    text: `Your PRIC verification code is ${code}.\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `
      <div style="background:#000;padding:32px 16px;font-family:Arial,sans-serif">
        <div style="max-width:480px;margin:0 auto;background:#111;border:1px solid #b9822a;border-radius:16px;padding:32px;color:#fff;text-align:center">
          <h1 style="margin:0 0 16px;color:#f4d587;letter-spacing:2px">PRIC</h1>
          <p style="margin:0 0 20px;line-height:1.5">Use this code to verify your email for your orders.</p>
          <p style="margin:0 0 20px;font-size:34px;font-weight:700;letter-spacing:10px;color:#f4d587">${esc(code)}</p>
          <p style="margin:0;font-size:12px;color:#aaa">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>`,
  });
}

const formatAddress = (a: OrderRecord["address"]) =>
  [a.street, `Brgy. ${a.barangay}`, a.city, a.province, a.postalCode]
    .filter(Boolean)
    .join(", ");

const paymentNote = (m: PaymentMethod) =>
  m === "cod"
    ? "Please prepare the exact amount upon delivery."
    : `${PAYMENT_LABELS[m]} was selected. PRIC will contact you with payment instructions.`;

export async function sendOrderConfirmation(o: OrderRecord) {
  const url = trackingUrl(o.trackingCode);
  const qr = await toBuffer(url, { width: 280, margin: 2 });
  const method = PAYMENT_LABELS[o.paymentMethod as PaymentMethod];
  const address = formatAddress(o.address);

  const itemRows = o.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 12px 6px 0;color:#fff">${esc(i.name)}</td>
        <td style="padding:6px 12px;color:#ccc;text-align:center">x${i.quantity}</td>
        <td style="padding:6px 0;color:#fff;text-align:right">${esc(peso(i.price * i.quantity))}</td>
      </tr>`,
    )
    .join("");

  const totalRow = (k: string, v: string, bold = false) =>
    `<tr><td colspan="2" style="padding:4px 12px 4px 0;color:${bold ? "#f4d587" : "#aaa"};text-align:right;${bold ? "font-weight:700" : ""}">${k}</td><td style="padding:4px 0;color:#fff;text-align:right;${bold ? "font-weight:700" : ""}">${esc(v)}</td></tr>`;

  const text = [
    `Thank you for your order, ${o.fullName}!`,
    `Tracking code: ${o.trackingCode}`,
    `Track: ${url}`,
    "",
    ...o.items.map((i) => `${i.name} x${i.quantity} - ${peso(i.price * i.quantity)}`),
    "",
    `Subtotal: ${peso(o.subtotal)}`,
    `Shipping: ${peso(o.shippingFee)}`,
    `Total: ${peso(o.total)}`,
    "",
    `Payment: ${method}. ${paymentNote(o.paymentMethod as PaymentMethod)}`,
    `Deliver to: ${o.fullName}, ${o.phone}`,
    address,
  ].join("\n");

  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: o.email,
    subject: `Your PRIC order ${o.trackingCode}`,
    text,
    attachments: [
      {
        filename: "tracking-qr.png",
        content: qr,
        cid: "tracking-qr",
        contentType: "image/png",
      },
    ],
    html: `
      <div style="background:#000;padding:32px 16px;font-family:Arial,sans-serif">
        <div style="max-width:560px;margin:0 auto;background:#111;border:1px solid #b9822a;border-radius:16px;padding:32px;color:#fff">
          <h1 style="margin:0 0 8px;color:#f4d587;letter-spacing:2px">PRIC</h1>
          <p style="margin:0 0 20px;line-height:1.5">Thank you for your order, ${esc(o.fullName)}!</p>

          <div style="text-align:center;margin:0 0 24px">
            <p style="margin:0 0 4px;font-size:12px;color:#aaa">TRACKING CODE</p>
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;letter-spacing:2px;color:#f4d587">${esc(o.trackingCode)}</p>
            <img src="cid:tracking-qr" alt="Tracking QR code" width="180" height="180" style="background:#fff;border-radius:12px" />
            <p style="margin:12px 0 0;font-size:12px;color:#aaa">Keep this QR code. It will be scanned upon delivery.</p>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${itemRows}
            <tr><td colspan="3" style="border-top:1px solid #333;padding-top:8px"></td></tr>
            ${totalRow("Subtotal", peso(o.subtotal))}
            ${totalRow("Shipping", peso(o.shippingFee))}
            ${totalRow("Total", peso(o.total), true)}
          </table>

          <p style="margin:24px 0 4px;font-size:12px;color:#aaa">PAYMENT</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${esc(method)}. ${esc(paymentNote(o.paymentMethod as PaymentMethod))}</p>

          <p style="margin:20px 0 4px;font-size:12px;color:#aaa">DELIVER TO</p>
          <p style="margin:0;font-size:14px;line-height:1.5">${esc(o.fullName)} &middot; ${esc(o.phone)}<br>${esc(address)}</p>
        </div>
      </div>`,
  });
}