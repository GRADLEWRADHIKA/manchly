import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/authController";
import prisma from "../prismaClient";
import { isTestAccount } from "../utils/otpManager";

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// ─── Rate Limiters ─────────────────────────────────────────────────────────────

// OTP send/resend — strict limit to prevent abuse
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  // This limiter keys on IP, so a QA machine hitting the test account
  // repeatedly would lock itself out. Exempt the test accounts only.
  skip: (req) => isTestAccount(req.body?.email || req.body?.phone_number || ""),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many OTP requests, please try again later." },
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP verify — strict limit to prevent brute-force
const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many verification attempts, please try again later." },
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Login — tighter limit to prevent brute-force password attacks
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // 10 attempts per IP per window
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many login attempts. Please try again in 15 minutes." },
      timestamp: new Date().toISOString(),
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── JWT middleware ────────────────────────────────────────────────────────────
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    // Per-device revocation (Feature #2): device-bound tokens are only valid
    // while their device is still registered for that role. Legacy tokens
    // (no deviceId) skip this check. Fails open on a DB error to avoid locking
    // users out on a transient blip.
    if (user?.deviceId) {
      try {
        const device = await prisma.user_devices.findFirst({
          where: {
            user_id: user.userId,
            device_id: user.deviceId,
            ...(user.userType && { user_type: user.userType }),
          },
          select: { id: true },
        });
        if (!device) {
          return res.status(401).json({ error: "Device access revoked. Please log in again.", code: "DEVICE_REVOKED" });
        }
      } catch (e) {
        console.error("authenticateToken device check error:", e);
      }
    }
    req.user = user;
    next();
  });
};

// ─── Routes ────────────────────────────────────────────────────────────────────

// 1. Signup — create user with hashed password
router.post("/signup", AuthController.signup);

// 2. Login — email + password (new primary login flow)
router.post("/login", loginRateLimiter, AuthController.login);

// 3. Reset Password — consumes reset_token issued by verifyOTP (purpose=password_reset)
router.post("/reset-password", AuthController.resetPassword);

// ─── OTP routes (kept intact — used for password reset flow) ──────────────────

// 4. Send OTP via Email
router.post("/send-otp/email", otpRateLimiter, AuthController.sendEmailOTP);

// 5. Send OTP via SMS
router.post("/send-otp/sms", otpRateLimiter, AuthController.sendSMSOTP);

// 6. Verify OTP and issue JWT / reset_token
router.post("/verify-otp", verifyRateLimiter, AuthController.verifyOTP);

// 7. Resend OTP
router.post("/resend-otp", otpRateLimiter, AuthController.resendOTP);

// 8. Check OTP Status
router.get("/otp-status/:identifier", AuthController.checkOTPStatus);

// 9. Invalidate OTP
router.delete("/invalidate-otp", AuthController.invalidateOTP);

// 10. Get OTP Statistics (Admin endpoint)
router.get("/admin/otp-stats", authenticateToken, AuthController.getOTPStats);

// ─── Protected routes ──────────────────────────────────────────────────────────

// 11. Update User Profile
router.put("/profile", authenticateToken, AuthController.updateProfile);

// 12. Get Current User
router.get("/me", authenticateToken, AuthController.getCurrentUser);

// Device management (Feature #2)
router.get("/devices", authenticateToken, AuthController.getMyDevices);
router.delete("/devices/:device_id", authenticateToken, AuthController.removeDevice);

// ─── Utility routes ────────────────────────────────────────────────────────────

// 13. Check if user exists by email or phone
router.post("/check-user", AuthController.checkUserExists);

// 14. Health check
router.get("/health", AuthController.healthCheck);

export default router;