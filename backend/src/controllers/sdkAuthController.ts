import { Request, Response } from "express";
import prisma from "../prismaClient";
import { UserType } from "@prisma/client";
import OTPManager from "../utils/otpManager";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { isCreator } from "../utils/userTypeHelper";
import dotenv from "dotenv";

dotenv.config();

// Same OTP config used by xtech auth — email-based, short TTL, max 3 attempts.
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

// ─── Helpers ───

function sanitize(s: unknown): string {
  return String(s ?? "").trim().replace(/[<>'"]/g, "");
}
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
function stripCountryCode(phone: string): string {
  let s = phone.replace(/[\s\-()]/g, "");
  // Only strip +91 or 91/0 prefix when total length indicates it's really a prefix.
  // Prevents false-stripping a domestic number that happens to start with "91".
  if (s.startsWith("+91") && s.length === 13) s = s.slice(3);
  else if (s.startsWith("91")  && s.length === 12) s = s.slice(2);
  else if (s.startsWith("0")   && s.length === 11) s = s.slice(1);
  return s;
}
function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(stripCountryCode(phone));
}
function normalizePhone(phone: string): string {
  return "+91" + stripCountryCode(phone);
}

// ─── Controller ───
// Creator-onboarding endpoints used by the public Manchly SDK.
// Flow:
//   1. Creator enters email+phone on their own site  →  POST /sdk/creator/request-otp
//   2. Backend verifies the account is a CREATOR and sends OTP to their email
//   3. Creator enters OTP                            →  POST /sdk/creator/verify
//   4. Backend returns { creator_id, name } which the SDK stores locally

export class SdkAuthController {
  /**
   * POST /sdk/creator/request-otp
   * Body: { email, phone }
   * Sends OTP if email + phone match an existing CREATOR account.
   * Generic error messages used to avoid account enumeration.
   */
  static async requestOtp(req: Request, res: Response) {
    let { email, phone } = req.body || {};
    email = sanitize(email).toLowerCase();
    phone = sanitize(phone);

    if (!email) return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
    if (!phone) return ApiResponseHandler.customError(res, "Phone number is required", 400, "MISSING_PHONE");
    if (!isValidEmail(email)) return ApiResponseHandler.customError(res, "Invalid email format", 400, "INVALID_EMAIL");
    if (!isValidPhone(phone)) return ApiResponseHandler.customError(res, "Enter a valid 10-digit mobile number", 400, "INVALID_PHONE");

    const normalizedPhone = normalizePhone(phone);

    try {
      const user = await prisma.users.findUnique({ where: { email } });

      // Normalize the stored phone the same way as the input so mixed formats
      // (stored as "9161299402" vs "+919161299402" vs "919161299402") all match.
      const storedPhoneNormalized = user?.phone ? normalizePhone(user.phone) : "";

      // Generic response if (a) user doesn't exist, (b) phone doesn't match, or (c) not a creator.
      // We do not reveal which of these is true.
      if (!user || storedPhoneNormalized !== normalizedPhone || !isCreator(user.user_type as any)) {
        return ApiResponseHandler.customError(
          res,
          "No creator account matches those details. Sign up at manchly.com and publish a course first.",
          404,
          "CREATOR_NOT_FOUND"
        );
      }

      await otpManager.sendOTP(email, 6, "email");
      return ApiResponseHandler.success(res, { email }, "OTP sent to your email");
    } catch (err: any) {
      if (err?.message?.includes("Rate limit")) {
        return ApiResponseHandler.customError(res, "Too many OTP requests. Try again in a minute.", 429, "RATE_LIMITED");
      }
      console.error("sdk requestOtp error:", err);
      return ApiResponseHandler.customError(res, "Could not send OTP. Please try again.", 500, "OTP_SEND_FAILED");
    }
  }

  /**
   * POST /sdk/creator/verify
   * Body: { email, code }
   * Verifies the OTP and returns { creator_id, name } for the SDK to store.
   * No JWT is issued — this only proves ownership for displaying the creator's
   * public course catalog on a third-party site.
   */
  static async verify(req: Request, res: Response) {
    let { email, code } = req.body || {};
    email = sanitize(email).toLowerCase();
    code = sanitize(code);

    if (!email) return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
    if (!code) return ApiResponseHandler.customError(res, "OTP is required", 400, "MISSING_OTP");
    if (!/^\d{6}$/.test(code)) return ApiResponseHandler.customError(res, "OTP must be 6 digits", 400, "INVALID_OTP");

    try {
      const result = await otpManager.verifyOTP(email, code);
      if (!result?.success) {
        return ApiResponseHandler.customError(res, result?.message || "Invalid or expired OTP", 400, "INVALID_OTP");
      }

      const user = await prisma.users.findUnique({
        where: { email },
        select: { id: true, name: true, email: true, user_type: true, phone: true, profile_image: true },
      });
      if (!user || !isCreator(user.user_type as any)) {
        return ApiResponseHandler.customError(res, "This account is not a creator.", 403, "NOT_A_CREATOR");
      }

      // Count published courses so the SDK can show a helpful empty state if needed.
      const courseCount = await prisma.courses.count({
        where: { creator_id: user.id, status: "PUBLISHED" as any },
      });

      return ApiResponseHandler.success(
        res,
        {
          creator_id: user.id,
          name: user.name,
          email: user.email,
          profile_image: user.profile_image,
          course_count: courseCount,
        },
        "Creator account verified"
      );
    } catch (err: any) {
      console.error("sdk verify error:", err);
      return ApiResponseHandler.customError(res, "Could not verify OTP. Please try again.", 500, "VERIFY_FAILED");
    }
  }
}
