import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { Inquiry, type InquiryService } from "../database/models/inquiry.model";
import { InquiryOtp } from "../database/models/inquiryOtp.model";
import { sendInquiryNotification, sendInquiryOtpEmail } from "../services/inquiryMail.service";
import { logger } from "../utils/logger";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const TOKEN_TTL_S = 15 * 60;

const hashCode = (email: string, code: string) =>
  createHmac("sha256", env.JWT_SECRET).update(`${email}:${code}`).digest("hex");

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
};

export const sendOtp: RequestHandler = async (req, res) => {
  const { email } = req.body as { email: string };

  const recent = await InquiryOtp.exists({
    email,
    createdAt: { $gt: new Date(Date.now() - RESEND_MS) },
  });
  if (recent) {
    res.status(429).json({ message: "Please wait a moment before requesting another code." });
    return;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await InquiryOtp.deleteMany({ email });
  const doc = await InquiryOtp.create({
    email,
    codeHash: hashCode(email, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  try {
    await sendInquiryOtpEmail(email, code);
  } catch (err) {
    logger.error({ err }, "Failed to send inquiry OTP email");
    await InquiryOtp.deleteOne({ _id: doc._id });
    res.status(502).json({ message: "We couldn't send the verification code. Please try again." });
    return;
  }

  res.json({ message: "Verification code sent." });
};

export const verifyOtp: RequestHandler = async (req, res) => {
  const { email, code } = req.body as { email: string; code: string };
  const now = new Date();

  // Atomic attempt counter: concurrent guesses can't exceed MAX_ATTEMPTS.
  const doc = await InquiryOtp.findOneAndUpdate(
    { email, verifiedAt: null, expiresAt: { $gt: now }, attempts: { $lt: MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!doc) {
    res.status(400).json({ message: "This code has expired or is no longer valid. Request a new one." });
    return;
  }

  if (!safeEqual(doc.codeHash, hashCode(email, code))) {
    const left = MAX_ATTEMPTS - doc.attempts;
    res.status(400).json({
      message:
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
          : "Too many incorrect attempts. Request a new code.",
    });
    return;
  }

  doc.verifiedAt = now;
  doc.expiresAt = new Date(now.getTime() + TOKEN_TTL_S * 1000);
  await doc.save();

  const verificationToken = jwt.sign({ purpose: "inquiry-email", email }, env.JWT_SECRET, {
    subject: doc.id,
    expiresIn: TOKEN_TTL_S,
  });
  res.json({ verificationToken });
};

export const createInquiry: RequestHandler = async (req, res) => {
  const { service, fullName, email, phone, message, verificationToken } = req.body as {
    service: InquiryService;
    fullName: string;
    email: string;
    phone: string;
    message: string;
    verificationToken: string;
  };

  const expired = () =>
    res.status(401).json({ message: "Email verification expired. Please verify your email again." });

  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(verificationToken, env.JWT_SECRET);
    if (typeof decoded === "string") return void expired();
    payload = decoded;
  } catch {
    return void expired();
  }
  if (payload.purpose !== "inquiry-email" || payload.email !== email || !payload.sub) {
    return void expired();
  }

  // Single use: the verified OTP record is consumed by this submission.
  const otp = await InquiryOtp.findOneAndDelete({
    _id: payload.sub,
    email,
    verifiedAt: { $ne: null },
    expiresAt: { $gt: new Date() },
  });
  if (!otp?.verifiedAt) return void expired();

  const inquiry = await Inquiry.create({
    service,
    fullName,
    email,
    phone,
    message,
    emailVerifiedAt: otp.verifiedAt,
  });

  // The record is already saved; a mail failure must not lose the inquiry.
  try {
    await sendInquiryNotification({ service, fullName, email, phone, message, id: inquiry.id });
    await Inquiry.updateOne({ _id: inquiry._id }, { emailNotifiedAt: new Date() });
  } catch (err) {
    logger.error({ err, inquiryId: inquiry.id }, "Failed to send inquiry notification email");
  }

  res.status(201).json({ message: "Inquiry received.", id: inquiry.id });
};