import express from "express";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { AuthController } from "../controllers/authController";

dotenv.config();
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Rate limiting (disabled for development)
const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit (effectively disabled)
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many OTP requests, please try again later."
      },
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit (effectively disabled)
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many verification attempts, please try again later."
      },
      timestamp: new Date().toISOString()
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

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
router.post("/signup", AuthController.signup);

// 2. Send OTP via Email
router.post("/send-otp/email", otpRateLimiter, AuthController.sendEmailOTP);

// 3. Send OTP via SMS
router.post("/send-otp/sms", otpRateLimiter, AuthController.sendSMSOTP);

// 4. Verify OTP and issue JWT
router.post("/verify-otp", verifyRateLimiter, AuthController.verifyOTP);

// 5. Resend OTP
router.post("/resend-otp", otpRateLimiter, AuthController.resendOTP);

// 6. Check OTP Status
router.get("/otp-status/:identifier", AuthController.checkOTPStatus);

// 7. Invalidate OTP
router.delete("/invalidate-otp", AuthController.invalidateOTP);

// 8. Get OTP Statistics (Admin endpoint)
router.get("/admin/otp-stats", authenticateToken, AuthController.getOTPStats);

// 9. Update User Profile (Protected)
router.put("/profile", authenticateToken, AuthController.updateProfile);

// 10. Get Current User (Protected)
router.get("/me", authenticateToken, AuthController.getCurrentUser);

// 11. Check if user exists by email or phone
router.post("/check-user", AuthController.checkUserExists);

// Health check endpoint
router.get("/health", AuthController.healthCheck);

export default router;