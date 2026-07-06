import { Request, Response } from "express";
import prisma from "../prismaClient";
import { UserType } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import OTPManager from "../utils/otpManager";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { issueAccessToken, serializeAuthUser } from "../utils/userSerializer";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const BCRYPT_ROUNDS = 12;

// ─── AUTH_USER_SELECT ──────────────────────────────────────────────────────────
// password is intentionally excluded — never returned in any response
const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  profile_image: true,
  user_type: true,
  companyName: true,
  isPremium: true,
  freeViewsCount: true,
  premiumExpiresAt: true,
  dob: true,
  kyc_verified: true,
  fcm_token: true,
  instagram_link: true,
  linkedin_link: true,
  youtube_link: true,
  facebook_link: true,
} as const;

// ─── OTP Manager Configuration ────────────────────────────────────────────────
const emailConfig = {
  host: process.env.EMAIL_HOST || "smtp.hostinger.com",
  port: Number(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASSWORD!,
  },
  from: process.env.EMAIL_FROM || "noreply@manchly.com",
};

const smsConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  senderId: process.env.SMS_SENDER_ID || "OTPService",
};

// Redis config — support both REDIS_URL and individual config
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

// Initialize OTP Manager — SMS enabled if Fast2SMS API key OR AWS credentials exist
const otpManager = new OTPManager(
  {
    length: 6,
    ttl: 180, // 3 minutes
    maxAttempts: 3,
    emailEnabled: true,
    smsEnabled: !!(process.env.FAST2SMS_API_KEY || process.env.AWS_ACCESS_KEY_ID),
  },
  emailConfig,
  smsConfig,
  redisConfig,
);

// ─── Validation helpers ────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhoneNumber(phone: string): boolean {
  return /^\+?[\d\s\-()\d]{10,}$/.test(phone);
}

function validateTabAgainstUserTypes(
  tab: string | undefined,
  userTypes: string[],
  bypassEmail?: string,
  email?: string,
): boolean {
  if (!tab) return true;
  if (bypassEmail && email === bypassEmail) return true;

  const normaliseTab = (t: string) => {
    const up = t.toUpperCase().trim();
    return up === "USER" ? "BRAND" : up;
  };

  const normTab = normaliseTab(tab);
  const normUserTypes = userTypes.map((t) => normaliseTab(String(t)));
  return normUserTypes.includes(normTab);
}

// ─── AuthController ───────────────────────────────────────────────────────────
export class AuthController {
  // Helper — normalize user_type to UserType array
  private static normalizeUserTypes(
    user_type: string | string[] | undefined,
  ): UserType[] {
    const validUserTypes: UserType[] = [
      UserType.USER,
      UserType.CREATOR,
      UserType.BRAND,
      UserType.AGENCY,
      UserType.ADMIN,
    ];

    if (!user_type) return [UserType.USER];

    const typesArray = Array.isArray(user_type) ? user_type : [user_type];
    const normalizedTypes: UserType[] = [];
    for (const type of typesArray) {
      const upperType = type.toUpperCase();
      if (validUserTypes.includes(upperType as UserType)) {
        normalizedTypes.push(upperType as UserType);
      }
    }
    return [...new Set(normalizedTypes)];
  }

  // Helper — validate date of birth format (YYYY-MM-DD)
  private static isValidDOB(dob: string): boolean {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) return false;
    const date = new Date(dob);
    const today = new Date();
    return date instanceof Date && !isNaN(date.getTime()) && date <= today;
  }

  // ── 1. Signup — create user with hashed password ────────────────────────────
  static async signup(req: Request, res: Response) {
    const {
      email,
      phone,
      name,
      password,
      user_type,
      role,
      companyName,
      company_name,
      dob,
    } = req.body;

    // Field validation
    if (!email)
      return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
    if (!phone)
      return ApiResponseHandler.customError(res, "Phone number is required", 400, "MISSING_PHONE");
    if (!password)
      return ApiResponseHandler.customError(res, "Password is required", 400, "MISSING_PASSWORD");
    if (!isValidEmail(email))
      return ApiResponseHandler.customError(res, "Invalid email format", 400, "INVALID_EMAIL_FORMAT");
    if (typeof password !== "string" || password.length < 8)
      return ApiResponseHandler.customError(res, "Password must be at least 8 characters", 400, "WEAK_PASSWORD");
    if (dob && !AuthController.isValidDOB(dob))
      return ApiResponseHandler.customError(res, "Invalid date of birth format. Use YYYY-MM-DD", 400, "INVALID_DOB_FORMAT");

    // Normalize user_type
    let userTypesArray: UserType[];
    try {
      userTypesArray = AuthController.normalizeUserTypes(role || user_type);
      if (userTypesArray.length === 0)
        return ApiResponseHandler.customError(res, "Invalid user type(s). Must be USER, CREATOR, BRAND, AGENCY, or ADMIN", 400, "INVALID_USER_TYPE");
    } catch {
      return ApiResponseHandler.customError(res, "Invalid user type(s). Must be USER, CREATOR, BRAND, AGENCY, or ADMIN", 400, "INVALID_USER_TYPE");
    }

    try {
      const organizationRoleSelected = userTypesArray.some(
        (type) => type === UserType.BRAND || type === UserType.AGENCY,
      );
      const normalizedCompanyName =
        typeof (company_name ?? companyName) === "string"
          ? String(company_name ?? companyName).trim()
          : undefined;

      if (organizationRoleSelected && !normalizedCompanyName)
        return ApiResponseHandler.customError(res, "Company name is required for brand and agency accounts", 400, "MISSING_COMPANY_NAME");

      // Check for existing email — hard reject (no upsert, prevents account takeover)
      const existingByEmail = await prisma.users.findUnique({ where: { email } });
      if (existingByEmail)
        return ApiResponseHandler.customError(res, "Email is already registered. Please log in.", 409, "EMAIL_ALREADY_EXISTS");

      // Check for existing phone
      const existingByPhone = await prisma.users.findFirst({ where: { phone } });
      if (existingByPhone)
        return ApiResponseHandler.customError(res, "Phone number already registered with a different email.", 409, "PHONE_ALREADY_EXISTS");

      // Hash password — never store plaintext
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create new user
      const user = await prisma.users.create({
        data: {
          email,
          phone,
          name,
          password: passwordHash,
          user_type: userTypesArray.length > 0 ? userTypesArray : [UserType.USER],
          ...(organizationRoleSelected && { companyName: normalizedCompanyName }),
          ...(dob && { dob }),
        },
        select: AUTH_USER_SELECT, // password excluded
      });

      const token = issueAccessToken(user.id, user.email);
      return ApiResponseHandler.success(
        res,
        { token, user: serializeAuthUser(user) },
        "Account created successfully",
        201,
      );
    } catch (err: any) {
      console.error("===== SIGNUP ERROR =====");
      console.error(err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── 2. Login — email + password ─────────────────────────────────────────────
  static async login(req: Request, res: Response) {
    const { email, password, tab, fcm_token } = req.body;

    if (!email)
      return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
    if (!password)
      return ApiResponseHandler.customError(res, "Password is required", 400, "MISSING_PASSWORD");
    if (!isValidEmail(email))
      return ApiResponseHandler.customError(res, "Invalid email format", 400, "INVALID_EMAIL_FORMAT");

    try {
      // Fetch user including password hash — we only need it for comparison, not returning
      const userWithPassword = await prisma.users.findUnique({
        where: { email },
        select: {
          ...AUTH_USER_SELECT,
          password: true, // needed for bcrypt.compare — stripped below before response
        },
      });

      // Use identical 401 for "not found" and "wrong password" — prevents email enumeration
      if (!userWithPassword) {
        return ApiResponseHandler.customError(res, "Invalid email or password", 401, "INVALID_CREDENTIALS");
      }

      // Account exists but has no password (created via OTP before this migration)
      if (!userWithPassword.password) {
        return ApiResponseHandler.customError(
          res,
          "This account was created with OTP login. Use 'Forgot Password' to set a password, or continue with OTP.",
          401,
          "NO_PASSWORD_SET",
        );
      }

      // Compare password with stored hash
      const passwordMatch = await bcrypt.compare(password, userWithPassword.password);
      if (!passwordMatch) {
        return ApiResponseHandler.customError(res, "Invalid email or password", 401, "INVALID_CREDENTIALS");
      }

      // Optional: validate tab/user_type (same logic as OTP login)
      if (tab) {
        const userTypes = Array.isArray(userWithPassword.user_type)
          ? userWithPassword.user_type
          : [userWithPassword.user_type];
        if (!validateTabAgainstUserTypes(tab, userTypes as string[], "test@manchly.com", email)) {
          return ApiResponseHandler.customError(res, "Invalid user type for this account", 400, "INVALID_USER_TYPE");
        }
      }

      // Issue token + update last_login
      const token = issueAccessToken(userWithPassword.id, userWithPassword.email);
      const updatedUser = await prisma.users.update({
        where: { id: userWithPassword.id },
        data: {
          last_login: new Date(),
          ...(fcm_token && { fcm_token }),
        },
        select: AUTH_USER_SELECT, // password excluded
      });

      return ApiResponseHandler.success(
        res,
        { token, user: serializeAuthUser(updatedUser, tab) },
        "Login successful",
        200,
      );
    } catch (err: any) {
      console.error("===== LOGIN ERROR =====");
      console.error(err);
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 3. Reset Password (consumes reset_token from verifyOTP) ─────────────────
  static async resetPassword(req: Request, res: Response) {
    const { reset_token, new_password } = req.body;

    if (!reset_token)
      return ApiResponseHandler.customError(res, "Reset token is required", 400, "MISSING_RESET_TOKEN");
    if (!new_password)
      return ApiResponseHandler.customError(res, "New password is required", 400, "MISSING_PASSWORD");
    if (typeof new_password !== "string" || new_password.length < 8)
      return ApiResponseHandler.customError(res, "New password must be at least 8 characters", 400, "WEAK_PASSWORD");

    try {
      // Verify the reset token issued by verifyOTP (purpose=password_reset)
      let payload: any;
      try {
        payload = jwt.verify(reset_token, JWT_SECRET);
      } catch {
        return ApiResponseHandler.customError(res, "Invalid or expired reset token. Please request a new OTP.", 401, "INVALID_RESET_TOKEN");
      }

      if (payload.purpose !== "password_reset" || payload.type !== "reset") {
        return ApiResponseHandler.customError(res, "Invalid reset token", 401, "INVALID_RESET_TOKEN");
      }

      // Confirm the user still exists
      const user = await prisma.users.findUnique({ where: { id: payload.userId } });
      if (!user)
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");

      // Hash new password and update
      const passwordHash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
      await prisma.users.update({
        where: { id: payload.userId },
        data: { password: passwordHash },
      });

      return ApiResponseHandler.success(res, {}, "Password reset successfully. Please log in with your new password.", 200);
    } catch (err: any) {
      console.error("===== RESET PASSWORD ERROR =====");
      console.error(err);
      return ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 4. Send OTP via Email ────────────────────────────────────────────────────
  static async sendEmailOTP(req: Request, res: Response) {
    const { email, purpose = "login", tab } = req.body;

    if (!email) return ApiResponseHandler.customError(res, "Email is required", 400, "MISSING_EMAIL");
    if (!isValidEmail(email)) return ApiResponseHandler.customError(res, "Invalid email format", 400, "INVALID_EMAIL_FORMAT");

    const allowedPurposes = ["login", "signup", "verification", "password_reset"];
    if (!allowedPurposes.includes(purpose)) return ApiResponseHandler.customError(res, "Invalid purpose", 400, "INVALID_PURPOSE");

    try {
      if (purpose === "login") {
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) return ApiResponseHandler.customError(res, "User not found. Please sign up first.", 404, "USER_NOT_FOUND");
        const userTypes = Array.isArray(user.user_type) ? user.user_type : [user.user_type];
        if (!validateTabAgainstUserTypes(tab, userTypes as string[], "test@manchly.com", email)) {
          return ApiResponseHandler.customError(res, "Invalid user type", 400, "INVALID_USER_TYPE");
        }
      }

      const otp = await otpManager.sendOTP(email, 6, "email");
      ApiResponseHandler.success(res, { purpose, expires_in: "10 minutes", otp }, "OTP sent successfully to your email");
    } catch (err: any) {
      if (err.message.includes("Rate limit exceeded")) return ApiResponseHandler.customError(res, "Too many OTP requests. Please try again later.", 429, "RATE_LIMIT_EXCEEDED");
      if (err.message.includes("OTP already sent")) return ApiResponseHandler.customError(res, "OTP already sent. Please wait for it to expire or use the existing one.", 400, "OTP_ALREADY_SENT");
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 5. Send OTP via SMS ──────────────────────────────────────────────────────
  static async sendSMSOTP(req: Request, res: Response) {
    const { phone_number, purpose = "login", tab } = req.body;

    if (!phone_number) return ApiResponseHandler.customError(res, "Phone number is required", 400, "MISSING_PHONE");
    if (!isValidPhoneNumber(phone_number)) return ApiResponseHandler.customError(res, "Invalid phone number format", 400, "INVALID_PHONE_FORMAT");

    const allowedPurposes = ["login", "signup", "verification"];
    if (!allowedPurposes.includes(purpose)) return ApiResponseHandler.customError(res, "Invalid purpose", 400, "INVALID_PURPOSE");

    try {
      if (purpose === "login") {
        const user = await prisma.users.findFirst({ where: { phone: phone_number } });
        if (!user) return ApiResponseHandler.customError(res, "User not found. Please sign up first.", 404, "USER_NOT_FOUND");
        const userTypes = Array.isArray(user.user_type) ? user.user_type : [user.user_type];
        console.log("tab:", tab);
        console.log("user.user_type:", user.user_type);
        if (!validateTabAgainstUserTypes(tab, userTypes as string[])) {
          return ApiResponseHandler.customError(res, "Invalid user type", 400, "INVALID_USER_TYPE");
        }
      }

      const otp = await otpManager.sendOTP(phone_number, 6, "sms");
      ApiResponseHandler.success(res, { purpose, expires_in: "10 minutes", otp }, "OTP sent successfully to your phone");
    } catch (err: any) {
      if (err.message.includes("Rate limit exceeded")) return ApiResponseHandler.customError(res, "Too many OTP requests. Please try again later.", 429, "RATE_LIMIT_EXCEEDED");
      if (err.message.includes("OTP already sent")) return ApiResponseHandler.customError(res, "OTP already sent. Please wait for it to expire or use the existing one.", 400, "OTP_ALREADY_SENT");
      if (err.message.includes("SMS OTP is not enabled")) return ApiResponseHandler.customError(res, "SMS service is not configured", 400, "SMS_NOT_CONFIGURED");
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 6. Verify OTP and issue JWT ──────────────────────────────────────────────
  static async verifyOTP(req: Request, res: Response) {
    const { email, phone_number, code, purpose = "login", user_type, fcm_token } = req.body;

    if (!code) return ApiResponseHandler.customError(res, "OTP code is required", 400, "MISSING_OTP_CODE");
    if (!email && !phone_number) return ApiResponseHandler.customError(res, "Email or phone number is required", 400, "MISSING_IDENTIFIER");

    const identifier = email || phone_number;

    try {
      const verificationResult = await otpManager.verifyOTP(identifier, code);
      if (!verificationResult.success) {
        return ApiResponseHandler.customError(res, verificationResult.message, 400, "OTP_VERIFICATION_FAILED");
      }

      let user;
      if (email) {
        user = await prisma.users.findUnique({ where: { email } });
        if (!user) user = await prisma.users.create({ data: { email } });
      } else if (phone_number) {
        user = await prisma.users.findFirst({ where: { phone: phone_number } });
        if (!user) user = await prisma.users.create({ data: { phone: phone_number, email: "" } });
      }

      if (!user) return ApiResponseHandler.customError(res, "Failed to retrieve or create user", 500, "USER_CREATION_FAILED");

      if (purpose === "password_reset") {
        const resetToken = jwt.sign(
          { userId: user.id, purpose: "password_reset", type: "reset" },
          JWT_SECRET,
          { expiresIn: "15 minutes" },
        );
        return ApiResponseHandler.success(res, { reset_token: resetToken, purpose: "password_reset" }, "OTP verified successfully");
      }

      const token = issueAccessToken(user.id, user.email);
      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date(), ...(fcm_token && { fcm_token }) },
        select: AUTH_USER_SELECT,
      });

      ApiResponseHandler.success(res, { token, user: serializeAuthUser(updatedUser, user_type) }, "OTP verified successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 7. Resend OTP ────────────────────────────────────────────────────────────
  static async resendOTP(req: Request, res: Response) {
    const { email, phone_number, channel = "email" } = req.body;
    if (!email && !phone_number) return ApiResponseHandler.customError(res, "Email or phone number is required", 400, "MISSING_IDENTIFIER");
    const identifier = email || phone_number;
    try {
      const newOtp = await otpManager.resendOTP(identifier, channel as "email" | "sms");
      ApiResponseHandler.success(res, { channel, expires_in: "10 minutes", otp: newOtp }, `OTP resent successfully via ${channel}`);
    } catch (err: any) {
      if (err.message.includes("Rate limit exceeded")) return ApiResponseHandler.customError(res, "Too many OTP requests. Please try again later.", 429, "RATE_LIMIT_EXCEEDED");
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
static async signup(req: Request, res: Response) {
  try {
    console.log("========== SIGNUP REQUEST ==========");
    console.log("Request Body:", req.body);

    console.log("Name:", req.body.name);
    console.log("Email:", req.body.email);
    console.log("Phone:", req.body.phone);
    console.log("Role:", req.body.role);

    const { name, email, phone, role } = req.body;

    // Rest of your signup logic...

  } catch (err: any) {
    console.error("========== SIGNUP ERROR ==========");
    console.error(err);
    console.error(err.stack);

    ApiResponseHandler.unexpectedError(res, err, 500);
  }
}

  // ── 8. Check OTP Status ──────────────────────────────────────────────────────
  static async checkOTPStatus(req: Request, res: Response) {
    const { identifier } = req.params;
    try {
      const hasValidOTP = await otpManager.hasValidOTP(identifier);
      const otpData = await otpManager.getOTPData(identifier);
      ApiResponseHandler.success(res, {
        has_valid_otp: hasValidOTP,
        otp_data: otpData
          ? { attempts: otpData.attempts, created_at: otpData.createdAt, verified: otpData.verified, channel: otpData.channel }
          : null,
      }, "OTP status retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 9. Invalidate OTP ────────────────────────────────────────────────────────
  static async invalidateOTP(req: Request, res: Response) {
    const { email, phone_number } = req.body;
    if (!email && !phone_number) return ApiResponseHandler.customError(res, "Email or phone number is required", 400, "MISSING_IDENTIFIER");
    const identifier = email || phone_number;
    try {
      await otpManager.invalidateOTP(identifier);
      ApiResponseHandler.success(res, {}, "OTP invalidated successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 10. Get OTP Statistics (Admin) ───────────────────────────────────────────
  static async getOTPStats(req: Request, res: Response) {
    try {
      const stats = await otpManager.getStats();
      ApiResponseHandler.success(res, {
        active_otps: stats.activeOTPs,
        redis_enabled: stats.redisEnabled,
        timestamp: new Date().toISOString(),
      }, "OTP statistics retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 11. Update User Profile (Protected) ─────────────────────────────────────
  static async updateProfile(req: any, res: Response) {
    const {
      name, phone_number, user_type, role, companyName, company_name,
      profile_image, dob, fcm_token, instagram_link, linkedin_link, youtube_link, facebook_link,
    } = req.body;
    const { user } = req;

    let userTypesArray: UserType[] | undefined = undefined;
    if (role || user_type) {
      try {
        const newTypes = AuthController.normalizeUserTypes(role || user_type);
        if (newTypes.length === 0)
          return ApiResponseHandler.customError(res, "Invalid user type(s). Must be USER, STUDENT, CREATOR, BRAND, AGENCY, or ADMIN", 400, "INVALID_USER_TYPE");
        userTypesArray = newTypes;
      } catch {
        return ApiResponseHandler.customError(res, "Invalid user type(s). Must be USER, CREATOR, BRAND, AGENCY, or ADMIN", 400, "INVALID_USER_TYPE");
      }
    }

    try {
      const updateData: any = {
        name,
        phone: phone_number,
        profile_image,
        dob,
        fcm_token,
        instagram_link,
        linkedin_link,
        youtube_link,
        facebook_link,
        ...(companyName !== undefined || company_name !== undefined
          ? { companyName: typeof (company_name ?? companyName) === "string" ? String(company_name ?? companyName).trim() : null }
          : {}),
      };
      if (userTypesArray !== undefined) updateData.user_type = userTypesArray;

      const userData = await prisma.users.update({
        where: { id: user.userId },
        data: updateData,
        select: AUTH_USER_SELECT,
      });

      ApiResponseHandler.success(res, { user: serializeAuthUser(userData, user_type || role) }, "Profile updated successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 12. Get Current User (Protected) ────────────────────────────────────────
  static async getCurrentUser(req: any, res: Response) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: AUTH_USER_SELECT,
      });
      if (!user) return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      ApiResponseHandler.success(res, { user: serializeAuthUser(user) }, "User data retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 13. Check User Exists ────────────────────────────────────────────────────
  static async checkUserExists(req: Request, res: Response) {
    const { email, phone } = req.body;
    if (!email && !phone) return ApiResponseHandler.customError(res, "Email or phone number is required", 400, "MISSING_IDENTIFIER");
    try {
      const whereClause: any = {};
      if (email && phone) whereClause.OR = [{ email }, { phone }];
      else if (email) whereClause.email = email;
      else if (phone) whereClause.phone = phone;

      const user = await prisma.users.findFirst({
        where: whereClause,
        select: { id: true, email: true, phone: true, name: true, user_type: true, created_at: true },
      });

      if (user) {
        return ApiResponseHandler.success(res, {
          exists: true,
          user: { id: user.id, email: user.email, phone: user.phone, name: user.name, user_type: user.user_type },
        }, "User found", 200);
      } else {
        return ApiResponseHandler.success(res, { exists: false, user: null }, "User not found", 200);
      }
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ── 14. Health Check ─────────────────────────────────────────────────────────
  static async healthCheck(req: Request, res: Response) {
    let stats = { activeOTPs: 0, redisEnabled: false };
    let note: string | undefined;
    try {
      stats = await otpManager.getStats();
    } catch (err: any) {
      note = err?.message || "otp stats unavailable";
      console.warn("[health] otp stats unavailable:", note);
    }


    ApiResponseHandler.success(res, {
      status: stats.redisEnabled ? "healthy" : "degraded",
      otp_manager: {
        active_otps: stats.activeOTPs,
        redis_enabled: stats.redisEnabled,
        ...(note ? { note } : {}),
      },
      timestamp: new Date().toISOString(),
    }, "Service is healthy");
  }
}

