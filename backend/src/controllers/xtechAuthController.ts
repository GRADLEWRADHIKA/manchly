import { Request, Response, NextFunction } from "express";
import prisma from "../prismaClient";
import { UserType } from "@prisma/client";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import OTPManager from "../utils/otpManager";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { setActiveDevice, getActiveDevice } from "../lib/redisClient";
import { emitForceLogout } from "../utils/socketHandler";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Redis for device session tracking
let redis: Redis | null = null;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });
} else if (process.env.REDIS_HOST) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD,
  });
}

// OTP Manager (same config as main auth)
const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.hostinger.com",
  port: Number(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE === "true",
  auth: { user: process.env.EMAIL_USER!, pass: process.env.EMAIL_PASSWORD! },
  from: process.env.EMAIL_FROM || "noreply@manchly.com",
};

const redisConfig = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : process.env.REDIS_HOST
  ? {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB || 0),
    }
  : undefined;

const otpManager = new OTPManager(
  { length: 6, ttl: 180, maxAttempts: 3, emailEnabled: true, smsEnabled: false },
  emailConfig,
  {} as any,
  redisConfig
);

// ─── Sanitization & Validation helpers ───

function sanitize(s: unknown): string {
  return String(s ?? "")
    .trim()
    .replace(/[<>'"]/g, ""); // strip HTML-injection chars
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function stripCountryCode(phone: string): string {
  let s = phone.replace(/[\s\-()]/g, "");
  // Only strip +91 / 91 / leading 0 when total length indicates it's really a prefix.
  // Prevents false-stripping a domestic number that happens to start with "91".
  if (s.startsWith("+91") && s.length === 13) s = s.slice(3);
  else if (s.startsWith("91") && s.length === 12) s = s.slice(2);
  else if (s.startsWith("0")  && s.length === 11) s = s.slice(1);
  return s;
}

function isValidPhone(phone: string): boolean {
  // Accept +91XXXXXXXXXX or 10-digit starting with 6-9
  return /^[6-9]\d{9}$/.test(stripCountryCode(phone));
}

function normalizePhone(phone: string): string {
  return "+91" + stripCountryCode(phone);
}

function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 100 && /^[a-zA-Z\s.\-']+$/.test(name);
}

const DEVICE_KEY_PREFIX = "xtech_device:";

// ─── Controller ───

export class XtechAuthController {
  /**
   * POST /auth/xtech/register
   * Combined: validate inputs → create account if new → send OTP
   * Body: { name, email, phone, device_id }
   */
  static async register(req: Request, res: Response) {
    let { name, email, phone, device_id } = req.body;

    // Sanitize
    name = sanitize(name);
    email = sanitize(email).toLowerCase();
    phone = sanitize(phone);
    device_id = sanitize(device_id);

    // Validate all fields
    if (!name) return ApiResponseHandler.customError(res, "Name is required", 400, "MISSING_NAME");
    if (!email) return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
    if (!phone) return ApiResponseHandler.customError(res, "Phone number is required", 400, "MISSING_PHONE");
    if (!device_id) return ApiResponseHandler.customError(res, "Device ID is required", 400, "MISSING_DEVICE_ID");

    if (!isValidName(name)) return ApiResponseHandler.customError(res, "Name must be 2-100 characters, letters only", 400, "INVALID_NAME");
    if (!isValidEmail(email)) return ApiResponseHandler.customError(res, "Invalid email format", 400, "INVALID_EMAIL");
    if (!isValidPhone(phone)) return ApiResponseHandler.customError(res, "Enter a valid 10-digit Indian mobile number starting with 6-9", 400, "INVALID_PHONE");

    // Normalize to +91XXXXXXXXXX
    phone = normalizePhone(phone);

    try {
      // Find or create user
      let user = await prisma.users.findUnique({ where: { email } });

      if (user) {
        // Existing user — update name/phone and ensure USER role is present.
        // A creator logging in through xtech should also be able to purchase
        // courses; without this, payment calls return 403 FORBIDDEN.
        const currentTypes: UserType[] = Array.isArray(user.user_type)
          ? (user.user_type as UserType[])
          : (user.user_type ? [user.user_type as UserType] : []);
        const nextTypes = currentTypes.includes(UserType.USER)
          ? currentTypes
          : [...currentTypes, UserType.USER];

        user = await prisma.users.update({
          where: { email },
          data: { name, phone, user_type: nextTypes },
        });
      } else {
        // Check if phone is already taken by another email
        const phoneConflict = await prisma.users.findFirst({ where: { phone } });
        if (phoneConflict) {
          return ApiResponseHandler.customError(
            res,
            "Phone number already registered with a different email",
            409,
            "PHONE_CONFLICT"
          );
        }

        // Create new user
        user = await prisma.users.create({
          data: { name, email, phone, user_type: [UserType.USER] },
        });
      }

      // Send OTP to email
      const otp = await otpManager.sendOTP(email, 6, "email");

      ApiResponseHandler.success(
        res,
        { user_id: user.id, email: user.email, is_new: !user.last_login, otp },
        "OTP sent to your email"
      );
    } catch (err: any) {
      if (err.message?.includes("Rate limit")) {
        return ApiResponseHandler.customError(res, "Too many requests. Try again later.", 429, "RATE_LIMIT");
      }
      if (err.message?.includes("OTP already sent")) {
        return ApiResponseHandler.customError(res, "OTP already sent. Check your email or wait to retry.", 400, "OTP_ALREADY_SENT");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * POST /auth/xtech/verify
   * Verify OTP → bind device → issue JWT
   * Body: { email, code, device_id }
   */
  static async verify(req: Request, res: Response) {
    let { email, code, device_id } = req.body;

    email = sanitize(email).toLowerCase();
    code = sanitize(code);
    device_id = sanitize(device_id);

    if (!email) return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
    if (!code) return ApiResponseHandler.customError(res, "OTP code is required", 400, "MISSING_CODE");
    if (!device_id) return ApiResponseHandler.customError(res, "Device ID is required", 400, "MISSING_DEVICE_ID");
    if (!/^\d{6}$/.test(code)) return ApiResponseHandler.customError(res, "OTP must be 6 digits", 400, "INVALID_OTP_FORMAT");

    try {
      const result = await otpManager.verifyOTP(email, code);
      if (!result.success) {
        return ApiResponseHandler.customError(res, result.message, 400, "OTP_FAILED");
      }

      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");

      // ── Device binding: one device per account ──
      // Store the active device_id in Redis/memory. Old device is automatically invalidated.
      emitForceLogout(user.id, "Your account was signed in on another device. You have been logged out.");
      await setActiveDevice(user.id, device_id);

      // Issue JWT with device_id embedded
      const token = jwt.sign(
        { userId: user.id, email: user.email, device_id, type: "access" },
        JWT_SECRET,
        { expiresIn: "365d" }
      );

      await prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date() },
      });

      // Check if user is enrolled in any course (to decide "My Course" tab)
      const enrollmentCount = await prisma.enrollments.count({ where: { user_id: user.id } });

      ApiResponseHandler.success(res, {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          profile_image: user.profile_image,
        },
        has_courses: enrollmentCount > 0,
      }, "Logged in successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Middleware: authenticate JWT + enforce single-device rule
   * Reads Bearer token + X-Device-Id header
   */
  static async deviceAuth(req: any, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Access token required", code: "NO_TOKEN" });

    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const { userId, device_id: tokenDeviceId } = payload;
      const incomingDeviceId = tokenDeviceId || (req.headers["x-device-id"] as string);

      // Check device binding
      if (userId && incomingDeviceId) {
        const activeDevice = await getActiveDevice(userId);
        if (activeDevice && activeDevice !== incomingDeviceId) {
          return res.status(403).json({
            success: false,
            message: "Your account is active on another device. Please log in again.",
            code: "DEVICE_CONFLICT",
          });
        }
      }

      req.user = payload;
      next();
    } catch {
      return res.status(403).json({ success: false, message: "Invalid or expired token", code: "INVALID_TOKEN" });
    }
  }
}
