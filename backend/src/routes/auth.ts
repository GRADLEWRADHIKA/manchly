import express from "express";
import prisma from "../prismaClient";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import OTPManager from "../utils/otpManager"; // Import the OTPManager class

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// OTP Manager Configuration
const emailConfig = {
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!
  },
  from: process.env.FROM_EMAIL || "no-reply@example.com"
};

const smsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  senderId: process.env.SMS_SENDER_ID || "OTPService"
};

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD,
  db: Number(process.env.REDIS_DB || 0)
};

// Initialize OTP Manager
const otpManager = new OTPManager(
  {
    length: 6,
    ttl: 600, // 10 minutes
    maxAttempts: 3,
    emailEnabled: true,
    smsEnabled: !!process.env.AWS_ACCESS_KEY_ID // Enable SMS if AWS credentials exist
  },
  emailConfig,
  smsConfig,
  redisConfig
);

// Rate limiting
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 OTP requests per windowMs
  message: { error: "Too many OTP requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 verification attempts per windowMs
  message: { error: "Too many verification attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to validate phone number (basic validation)
function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// 1. Signup - create user record
router.post("/signup", async (req, res) => {
  const { email, phone_number, name } = req.body;
  
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email format" });
  
  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: { phone_number, name },
      create: { email, phone_number, name }
    });
    
    // Remove sensitive data from response
    const { ...userWithoutSensitive } = user;
    
    res.json({ 
      ok: true, 
      user: userWithoutSensitive,
      message: "User created successfully" 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
});

// 2. Send OTP via Email
router.post("/send-otp/email", otpRateLimiter, async (req, res) => {
  const { email, purpose = "login" } = req.body;
  
  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email format" });
  
  const allowedPurposes = ["login", "signup", "verification", "password_reset"];
  if (!allowedPurposes.includes(purpose)) {
    return res.status(400).json({ error: "Invalid purpose" });
  }

  try {
    // Check if user exists for login purpose
    if (purpose === "login") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: "User not found. Please sign up first." });
      }
    }

    // Use OTPManager to send OTP
    const otp = await otpManager.sendOTP(email, 6, 'email');
    
    // Store OTP purpose in database for reference
    await prisma.otpCode.create({
      data: {
        email,
        code: otp,
        purpose,
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false
      }
    });

    res.json({ 
      ok: true, 
      message: "OTP sent successfully to your email",
      purpose,
      expires_in: "10 minutes"
    });
  } catch (err: any) {
    if (err.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ error: "Too many OTP requests. Please try again later." });
    }
    if (err.message.includes('OTP already sent')) {
      return res.status(400).json({ error: "OTP already sent. Please wait for it to expire or use the existing one." });
    }
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
});

// 3. Send OTP via SMS
router.post("/send-otp/sms", otpRateLimiter, async (req, res) => {
  const { phone_number, purpose = "login" } = req.body;
  
  if (!phone_number) return res.status(400).json({ error: "Phone number is required" });
  if (!isValidPhoneNumber(phone_number)) return res.status(400).json({ error: "Invalid phone number format" });
  
  const allowedPurposes = ["login", "signup", "verification"];
  if (!allowedPurposes.includes(purpose)) {
    return res.status(400).json({ error: "Invalid purpose" });
  }

  try {
    // Find user by phone number for login purpose
    if (purpose === "login") {
      const user = await prisma.user.findFirst({ 
        where: { phone_number } 
      });
      if (!user) {
        return res.status(404).json({ error: "User not found. Please sign up first." });
      }
    }

    // Use OTPManager to send SMS OTP
    const otp = await otpManager.sendOTP(phone_number, 6, 'sms');

    res.json({ 
      ok: true, 
      message: "OTP sent successfully to your phone",
      purpose,
      expires_in: "10 minutes"
    });
  } catch (err: any) {
    if (err.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ error: "Too many OTP requests. Please try again later." });
    }
    if (err.message.includes('OTP already sent')) {
      return res.status(400).json({ error: "OTP already sent. Please wait for it to expire or use the existing one." });
    }
    if (err.message.includes('SMS OTP is not enabled')) {
      return res.status(400).json({ error: "SMS service is not configured" });
    }
    res.status(500).json({ error: err.message || "Failed to send OTP" });
  }
});

// 4. Verify OTP and issue JWT
router.post("/verify-otp", verifyRateLimiter, async (req, res) => {
  const { email, phone_number, code, purpose = "login" } = req.body;
  
  if (!code) return res.status(400).json({ error: "OTP code is required" });
  
  // Either email or phone_number must be provided
  if (!email && !phone_number) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }

  const identifier = email || phone_number;

  try {
    // Use OTPManager to verify OTP
    const verificationResult = await otpManager.verifyOTP(identifier, code);
    
    if (!verificationResult.success) {
      return res.status(400).json({ 
        error: verificationResult.message 
      });
    }

    // Find or create user
    let user;
    if (email) {
      user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({ data: { email } });
      }
    } else if (phone_number) {
      user = await prisma.user.findFirst({ where: { phone_number } });
      if (!user) {
        user = await prisma.user.create({ data: { phone_number } });
      }
    }

    if (!user) {
      return res.status(500).json({ error: "Failed to retrieve or create user" });
    }

    // For password reset, issue a short-lived reset token
    if (purpose === "password_reset") {
      const resetToken = jwt.sign(
        { 
          userId: user.id, 
          purpose: "password_reset",
          type: "reset"
        }, 
        JWT_SECRET, 
        { expiresIn: "15 minutes" }
      );

      return res.json({ 
        ok: true, 
        message: "OTP verified successfully",
        reset_token: resetToken,
        purpose: "password_reset"
      });
    }

    // For login/signup, issue regular JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: "access"
      }, 
      JWT_SECRET, 
      { expiresIn: "12h" }
    );

    // Update user last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() }
    });

    res.json({ 
      ok: true, 
      message: "OTP verified successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone_number: user.phone_number
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "OTP verification failed" });
  }
});

// 5. Resend OTP
router.post("/resend-otp", otpRateLimiter, async (req, res) => {
  const { email, phone_number, channel = "email" } = req.body;
  
  if (!email && !phone_number) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }

  const identifier = email || phone_number;

  try {
    // Use OTPManager to resend OTP
    const newOtp = await otpManager.resendOTP(identifier, channel as 'email' | 'sms');

    res.json({ 
      ok: true, 
      message: `OTP resent successfully via ${channel}`,
      channel,
      expires_in: "10 minutes"
    });
  } catch (err: any) {
    if (err.message.includes('Rate limit exceeded')) {
      return res.status(429).json({ error: "Too many OTP requests. Please try again later." });
    }
    res.status(500).json({ error: err.message || "Failed to resend OTP" });
  }
});

// 6. Check OTP Status
router.get("/otp-status/:identifier", async (req, res) => {
  const { identifier } = req.params;

  try {
    const hasValidOTP = await otpManager.hasValidOTP(identifier);
    const otpData = await otpManager.getOTPData(identifier);

    res.json({
      ok: true,
      has_valid_otp: hasValidOTP,
      otp_data: otpData ? {
        attempts: otpData.attempts,
        created_at: otpData.createdAt,
        verified: otpData.verified,
        channel: otpData.channel
      } : null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to check OTP status" });
  }
});

// 7. Invalidate OTP
router.delete("/invalidate-otp", async (req, res) => {
  const { email, phone_number } = req.body;
  
  if (!email && !phone_number) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }

  const identifier = email || phone_number;

  try {
    await otpManager.invalidateOTP(identifier);
    
    res.json({ 
      ok: true, 
      message: "OTP invalidated successfully" 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to invalidate OTP" });
  }
});

// 8. Get OTP Statistics (Admin endpoint)
router.get("/admin/otp-stats", authenticateToken, async (req, res) => {
  try {
    const stats = await otpManager.getStats();
    
    res.json({
      ok: true,
      stats: {
        active_otps: stats.activeOTPs,
        redis_enabled: stats.redisEnabled,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get OTP statistics" });
  }
});

// 9. Update User Profile (Protected)
router.put("/profile", authenticateToken, async (req, res) => {
  const { name, phone_number } = req.body;

  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, phone_number }
    });

    const { ...userWithoutSensitive } = user;

    res.json({
      ok: true,
      message: "Profile updated successfully",
      user: userWithoutSensitive
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update profile" });
  }
});

// 10. Get Current User (Protected)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone_number: true,
        created_at: true,
        last_login: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      ok: true,
      user
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get user data" });
  }
});

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    const stats = await otpManager.getStats();
    
    res.json({
      ok: true,
      status: "healthy",
      otp_manager: {
        active_otps: stats.activeOTPs,
        redis_enabled: stats.redisEnabled
      },
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ 
      ok: false,
      status: "unhealthy",
      error: err.message 
    });
  }
});

export default router;