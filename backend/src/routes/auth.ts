import express from "express";
import prisma from "../prismaClient";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const router = express.Router();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@example.com";
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn("SMTP not fully configured. Sending emails will fail until SMTP env vars are set.");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// Helper to generate 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Signup - create user record without password
router.post("/signup", async (req, res) => {
  const { email, phone_number, name } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { phone_number, name },
      create: { email, phone_number, name }
    });
    res.json({ ok: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
});

// Send OTP to email for login (or signup flow)
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  try {
    // ensure user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }

    const code = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: {
        email,
        code,
        expires_at: expires
      }
    });

    // send email
    const mail = {
      from: FROM_EMAIL,
      to: email,
      subject: "Your OTP code",
      text: `Your OTP code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your OTP code is <b>${code}</b>. It expires in 10 minutes.</p>`
    };

    try {
      await transporter.sendMail(mail);
    } catch (mailErr: any) {
      console.error("Error sending email:", mailErr);
      // don't fail—still respond ok if you want, but warn user
      return res.status(500).json({ error: "Failed to send email. Check SMTP settings." });
    }

    res.json({ ok: true, message: "OTP sent" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to send otp" });
  }
});

// Verify OTP and issue JWT
router.post("/verify-otp", async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "email and code are required" });
  try {
    const otp = await prisma.otpCode.findFirst({
      where: { email, code, used: false },
      orderBy: { created_at: "desc" }
    });
    if (!otp) return res.status(400).json({ error: "Invalid OTP" });
    if (new Date() > otp.expires_at) return res.status(400).json({ error: "OTP expired" });

    // mark used
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

    // ensure user exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }

    // issue JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "12h" });
    res.json({ ok: true, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "OTP verification failed" });
  }
});

export default router;
