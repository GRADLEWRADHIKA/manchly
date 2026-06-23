import { Request, Response } from "express";
import prisma from "../prismaClient";
import { UserType } from "@prisma/client";
import jwt from "jsonwebtoken";
import OTPManager from "../utils/otpManager";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { issueAccessToken, serializeAuthUser } from "../utils/userSerializer";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

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

// OTP Manager Configuration
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

// Redis config - support both REDIS_URL and individual config
const redisConfig = process.env.REDIS_URL
  ? {
      url: process.env.REDIS_URL,
    }
  : process.env.REDIS_HOST
    ? {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB || 0),
      }
    : undefined;

// Initialize OTP Manager
// SMS enabled if Fast2SMS API key OR AWS credentials exist
const otpManager = new OTPManager(
  {
    length: 6,
    ttl: 180, // 3 minutes
    maxAttempts: 3,
    emailEnabled: true,
    smsEnabled: !!(
      process.env.FAST2SMS_API_KEY || process.env.AWS_ACCESS_KEY_ID
    ),
  },
  emailConfig,
  smsConfig,
  redisConfig,
);

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

function validateTabAgainstUserTypes(
  tab: string | undefined,
  userTypes: string[],
  bypassEmail?: string,  // test account bypass
  email?: string,
): boolean {
  // No tab supplied → skip validation, let the user through
  if (!tab) return true;

  // Test-account bypass (keep existing behaviour)
  if (bypassEmail && email === bypassEmail) return true;

  
  const normaliseTab = (t: string) => {
    const up = t.toUpperCase().trim();
    return up === "USER" ? "BRAND" : up;   
  };

  const normTab = normaliseTab(tab);
  const normUserTypes = userTypes.map(t => normaliseTab(String(t)));

  return normUserTypes.includes(normTab);
}

export class AuthController {
  // Helper function to normalize user_type to UserType array
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

    if (!user_type) {
      return [UserType.USER];
    }

    // Normalize to array
    const typesArray = Array.isArray(user_type) ? user_type : [user_type];

    // Validate and convert to UserType enum values
    const normalizedTypes: UserType[] = [];
    for (const type of typesArray) {
      const upperType = type.toUpperCase();
      if (validUserTypes.includes(upperType as UserType)) {
        normalizedTypes.push(upperType as UserType);
      }
    }

    // Remove duplicates and return
    return [...new Set(normalizedTypes)];
  }

  // Helper to validate date of birth format (YYYY-MM-DD)
  private static isValidDOB(dob: string): boolean {
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dob)) {
      return false;
    }
    const date = new Date(dob);
    const today = new Date();
    // Check if date is valid and not in the future
    return date instanceof Date && !isNaN(date.getTime()) && date <= today;
  }

  // 1. Signup - create user record
  static async signup(req: Request, res: Response) {
    const {
      email,
      phone,
      name,
      user_type,
      role,
      companyName,
      company_name,
      dob,
    } = req.body;

    if (!email) {
      return ApiResponseHandler.customError(
        res,
        "Email is required",
        400,
        "MISSING_EMAIL",
      );
    }
    if (!phone) {
      return ApiResponseHandler.customError(
        res,
        "Phone number is required",
        400,
        "MISSING_PHONE",
      );
    }
    if (!isValidEmail(email)) {
      return ApiResponseHandler.customError(
        res,
        "Invalid email format",
        400,
        "INVALID_EMAIL_FORMAT",
      );
    }
    if (dob && !AuthController.isValidDOB(dob)) {
      return ApiResponseHandler.customError(
        res,
        "Invalid date of birth format. Use YYYY-MM-DD format",
        400,
        "INVALID_DOB_FORMAT",
      );
    }

    // Normalize and validate user_type
    let userTypesArray: UserType[];
    try {
      userTypesArray = AuthController.normalizeUserTypes(role || user_type);

      // Validate that at least one valid type was provided
      if (userTypesArray.length === 0) {
        return ApiResponseHandler.customError(
          res,
          "Invalid user type(s). Must be USER,CREATOR, BRAND, AGENCY, or ADMIN",
          400,
          "INVALID_USER_TYPE",
        );
      }
    } catch (error) {
      return ApiResponseHandler.customError(
        res,
        "Invalid user type(s). Must be USER,CREATOR, BRAND, AGENCY, or ADMIN",
        400,
        "INVALID_USER_TYPE",
      );
    }

    try {
      const organizationRoleSelected = userTypesArray.some(
        (type) => type === UserType.BRAND || type === UserType.AGENCY,
      );
      const normalizedCompanyName =
        typeof (company_name ?? companyName) === "string"
          ? String(company_name ?? companyName).trim()
          : undefined;

      if (organizationRoleSelected && !normalizedCompanyName) {
        return ApiResponseHandler.customError(
          res,
          "Company name is required for brand and agency accounts",
          400,
          "MISSING_COMPANY_NAME",
        );
      }

      // Check if user already exists with this email or phone
      const existingUser = await prisma.users.findFirst({
        where: {
          OR: [{ email }, { phone }],
        },
      });

      if (existingUser) {
        // If email matches, update the user with the selected type
        if (existingUser.email === email) {
          const user = await prisma.users.update({
            where: { email },
            data: {
              phone,
              name,
              user_type: userTypesArray,
              companyName: organizationRoleSelected
                ? normalizedCompanyName
                : null,
              ...(dob && { dob }),
            },
            select: AUTH_USER_SELECT,
          });

          const token = issueAccessToken(user.id, user.email);
          return ApiResponseHandler.success(
            res,
            {
              token,
              user: serializeAuthUser(user),
            },
            "User updated successfully",
            200,
          );
        }

        // If only phone matches but different email, return error
        if (existingUser.phone === phone) {
          return ApiResponseHandler.customError(
            res,
            "Phone number already registered with a different email",
            409,
            "PHONE_ALREADY_EXISTS",
          );
        }
      }

      // Create new user - ensure user_type is properly formatted as array
      const user = await prisma.users.create({
        data: {
          email,
          phone,
          name,
          user_type:
            userTypesArray.length > 0 ? userTypesArray : [UserType.USER],
          ...(organizationRoleSelected && {
            companyName: normalizedCompanyName,
          }),
          ...(dob && { dob }),
        },
        select: AUTH_USER_SELECT,
      });

      const token = issueAccessToken(user.id, user.email);
      ApiResponseHandler.success(
        res,
        {
          token,
          user: serializeAuthUser(user),
        },
        "User created successfully",
        201,
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 2. Send OTP via Email
  static async sendEmailOTP(req: Request, res: Response) {
    const { email, purpose = "login", tab } = req.body;

    if (!email) {
      return ApiResponseHandler.customError(
        res,
        "Email is required",
        400,
        "MISSING_EMAIL",
      );
    }
    if (!isValidEmail(email)) {
      return ApiResponseHandler.customError(
        res,
        "Invalid email format",
        400,
        "INVALID_EMAIL_FORMAT",
      );
    }

    const allowedPurposes = [
      "login",
      "signup",
      "verification",
      "password_reset",
    ];
    if (!allowedPurposes.includes(purpose)) {
      return ApiResponseHandler.customError(
        res,
        "Invalid purpose",
        400,
        "INVALID_PURPOSE",
      );
    }

    try {
      // Check if user exists for login purpose
      if (purpose === "login") {
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
          return ApiResponseHandler.customError(
            res,
            "User not found. Please sign up first.",
            404,
            "USER_NOT_FOUND",
          );
        }
        // Check if user has the requested user type (user_type is now an array)
        const userTypes = Array.isArray(user.user_type)
          ? user.user_type
          : [user.user_type];
        if (!validateTabAgainstUserTypes(tab, userTypes as string[], "test@manchly.com", email)) {
          return ApiResponseHandler.customError(
            res, "Invalid user type", 400, "INVALID_USER_TYPE",
          );
          }
      }

      // Use OTPManager to send OTP
      const otp = await otpManager.sendOTP(email, 6, "email");

      ApiResponseHandler.success(
        res,
        {
          purpose,
          expires_in: "10 minutes",
          otp: otp, // Include OTP in response for testing
        },
        "OTP sent successfully to your email",
      );
    } catch (err: any) {
      if (err.message.includes("Rate limit exceeded")) {
        return ApiResponseHandler.customError(
          res,
          "Too many OTP requests. Please try again later.",
          429,
          "RATE_LIMIT_EXCEEDED",
        );
      }
      if (err.message.includes("OTP already sent")) {
        return ApiResponseHandler.customError(
          res,
          "OTP already sent. Please wait for it to expire or use the existing one.",
          400,
          "OTP_ALREADY_SENT",
        );
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 3. Send OTP via SMS
 static async sendSMSOTP(req: Request, res: Response) {
    const { phone_number, purpose = "login", tab } = req.body;

    if (!phone_number) {
      return ApiResponseHandler.customError(
        res,
        "Phone number is required",
        400,
        "MISSING_PHONE",
      );
    }
    if (!isValidPhoneNumber(phone_number)) {
      return ApiResponseHandler.customError(
        res,
        "Invalid phone number format",
        400,
        "INVALID_PHONE_FORMAT",
      );
    }

    const allowedPurposes = ["login", "signup", "verification"];
    if (!allowedPurposes.includes(purpose)) {
      return ApiResponseHandler.customError(
        res,
        "Invalid purpose",
        400,
        "INVALID_PURPOSE",
      );
    }

    try {
      // Find user by phone number for login purpose
      if (purpose === "login") {
        const user = await prisma.users.findFirst({
          where: { phone: phone_number },
        });
        if (!user) {
          return ApiResponseHandler.customError(
            res,
            "User not found. Please sign up first.",
            404,
            "USER_NOT_FOUND",
          );
        }
        // Check if user has the requested user type (user_type is now an array)
        const userTypes = Array.isArray(user.user_type)
          ? user.user_type
          : [user.user_type];
          //added and will remove 
        console.log("tab:", tab);
        console.log("user.user_type:", user.user_type);
          if (!validateTabAgainstUserTypes(tab, userTypes as string[])) {
          return ApiResponseHandler.customError(
            res, "Invalid user type", 400, "INVALID_USER_TYPE",
          );
        }
      }

      // Use OTPManager to send SMS OTP
      const otp = await otpManager.sendOTP(phone_number, 6, "sms");

      ApiResponseHandler.success(
        res,
        {
          purpose,
          expires_in: "10 minutes",
          otp: otp, // Include OTP in response for testing
        },
        "OTP sent successfully to your phone",
      );
    } catch (err: any) {
      if (err.message.includes("Rate limit exceeded")) {
        return ApiResponseHandler.customError(
          res,
          "Too many OTP requests. Please try again later.",
          429,
          "RATE_LIMIT_EXCEEDED",
        );
      }
      if (err.message.includes("OTP already sent")) {
        return ApiResponseHandler.customError(
          res,
          "OTP already sent. Please wait for it to expire or use the existing one.",
          400,
          "OTP_ALREADY_SENT",
        );
      }
      if (err.message.includes("SMS OTP is not enabled")) {
        return ApiResponseHandler.customError(
          res,
          "SMS service is not configured",
          400,
          "SMS_NOT_CONFIGURED",
        );
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 4. Verify OTP and issue JWT
  static async verifyOTP(req: Request, res: Response) {
    const {
      email,
      phone_number,
      code,
      purpose = "login",
      user_type,
      fcm_token,
    } = req.body;

    if (!code) {
      return ApiResponseHandler.customError(
        res,
        "OTP code is required",
        400,
        "MISSING_OTP_CODE",
      );
    }

    // Either email or phone_number must be provided
    if (!email && !phone_number) {
      return ApiResponseHandler.customError(
        res,
        "Email or phone number is required",
        400,
        "MISSING_IDENTIFIER",
      );
    }

    const identifier = email || phone_number;

    try {
      // Use OTPManager to verify OTP
      const verificationResult = await otpManager.verifyOTP(identifier, code);

      if (!verificationResult.success) {
        return ApiResponseHandler.customError(
          res,
          verificationResult.message,
          400,
          "OTP_VERIFICATION_FAILED",
        );
      }

      // Find or create user
      let user;
      if (email) {
        user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.users.create({ data: { email } });
        }
      } else if (phone_number) {
        user = await prisma.users.findFirst({ where: { phone: phone_number } });
        if (!user) {
          user = await prisma.users.create({
            data: { phone: phone_number, email: "" },
          });
        }
      }

      if (!user) {
        return ApiResponseHandler.customError(
          res,
          "Failed to retrieve or create user",
          500,
          "USER_CREATION_FAILED",
        );
      }

      // For password reset, issue a short-lived reset token
      if (purpose === "password_reset") {
        const resetToken = jwt.sign(
          {
            userId: user.id,
            purpose: "password_reset",
            type: "reset",
          },
          JWT_SECRET,
          { expiresIn: "15 minutes" },
        );

        return ApiResponseHandler.success(
          res,
          {
            reset_token: resetToken,
            purpose: "password_reset",
          },
          "OTP verified successfully",
        );
      }

      // For login/signup, issue regular JWT
      const token = issueAccessToken(user.id, user.email);

      // Update user last login time and fcm token
      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: { last_login: new Date(), ...(fcm_token && { fcm_token }) },
        select: AUTH_USER_SELECT,
      });

      ApiResponseHandler.success(
        res,
        {
          token,
          user: serializeAuthUser(updatedUser, user_type),
        },
        "OTP verified successfully",
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 5. Resend OTP
  static async resendOTP(req: Request, res: Response) {
    const { email, phone_number, channel = "email" } = req.body;

    if (!email && !phone_number) {
      return ApiResponseHandler.customError(
        res,
        "Email or phone number is required",
        400,
        "MISSING_IDENTIFIER",
      );
    }

    const identifier = email || phone_number;

    try {
      // Use OTPManager to resend OTP
      const newOtp = await otpManager.resendOTP(
        identifier,
        channel as "email" | "sms",
      );

      ApiResponseHandler.success(
        res,
        {
          channel,
          expires_in: "10 minutes",
          otp: newOtp, // Include OTP in response for testing
        },
        `OTP resent successfully via ${channel}`,
      );
    } catch (err: any) {
      if (err.message.includes("Rate limit exceeded")) {
        return ApiResponseHandler.customError(
          res,
          "Too many OTP requests. Please try again later.",
          429,
          "RATE_LIMIT_EXCEEDED",
        );
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 6. Check OTP Status
  static async checkOTPStatus(req: Request, res: Response) {
    const { identifier } = req.params;

    try {
      const hasValidOTP = await otpManager.hasValidOTP(identifier);
      const otpData = await otpManager.getOTPData(identifier);

      ApiResponseHandler.success(
        res,
        {
          has_valid_otp: hasValidOTP,
          otp_data: otpData
            ? {
                attempts: otpData.attempts,
                created_at: otpData.createdAt,
                verified: otpData.verified,
                channel: otpData.channel,
              }
            : null,
        },
        "OTP status retrieved successfully",
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 7. Invalidate OTP
  static async invalidateOTP(req: Request, res: Response) {
    const { email, phone_number } = req.body;

    if (!email && !phone_number) {
      return ApiResponseHandler.customError(
        res,
        "Email or phone number is required",
        400,
        "MISSING_IDENTIFIER",
      );
    }

    const identifier = email || phone_number;

    try {
      await otpManager.invalidateOTP(identifier);

      ApiResponseHandler.success(res, {}, "OTP invalidated successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 8. Get OTP Statistics (Admin endpoint)
  static async getOTPStats(req: Request, res: Response) {
    try {
      const stats = await otpManager.getStats();

      ApiResponseHandler.success(
        res,
        {
          active_otps: stats.activeOTPs,
          redis_enabled: stats.redisEnabled,
          timestamp: new Date().toISOString(),
        },
        "OTP statistics retrieved successfully",
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 9. Update User Profile (Protected)
  static async updateProfile(req: any, res: Response) {
    const {
      name,
      phone_number,
      user_type,
      role,
      companyName,
      company_name,
      profile_image,
      dob,
      fcm_token,
      instagram_link,
      linkedin_link,
      youtube_link,
      facebook_link,
    } = req.body;
    const { user } = req;

    // Validate and process user_type if provided
    let userTypesArray: UserType[] | undefined = undefined;
    if (role || user_type) {
      try {
        const newTypes = AuthController.normalizeUserTypes(role || user_type);

        if (newTypes.length === 0) {
          return ApiResponseHandler.customError(
            res,
            "Invalid user type(s). Must be USER, STUDENT, CREATOR, BRAND, AGENCY, or ADMIN",
            400,
            "INVALID_USER_TYPE",
          );
        }

        // Set to the requested type (no merging)
        userTypesArray = newTypes;
      } catch (error) {
        return ApiResponseHandler.customError(
          res,
          "Invalid user type(s). Must be USER, CREATOR, BRAND, AGENCY, or ADMIN",
          400,
          "INVALID_USER_TYPE",
        );
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
          ? {
              companyName:
                typeof (company_name ?? companyName) === "string"
                  ? String(company_name ?? companyName).trim()
                  : null,
            }
          : {}),
      };

      if (userTypesArray !== undefined) {
        updateData.user_type = userTypesArray;
      }

      const userData = await prisma.users.update({
        where: { id: user.userId },
        data: updateData,
        select: AUTH_USER_SELECT,
      });

      ApiResponseHandler.success(
        res,
        {
          user: serializeAuthUser(userData, user_type || role),
        },
        "Profile updated successfully",
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // 10. Get Current User (Protected)
  static async getCurrentUser(req: any, res: Response) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: AUTH_USER_SELECT,
      });

      if (!user) {
        return ApiResponseHandler.customError(
          res,
          "User not found",
          404,
          "USER_NOT_FOUND",
        );
      }

      ApiResponseHandler.success(
        res,
        {
          user: serializeAuthUser(user),
        },
        "User data retrieved successfully",
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  static async checkUserExists(req: Request, res: Response) {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return ApiResponseHandler.customError(
        res,
        "Email or phone number is required",
        400,
        "MISSING_IDENTIFIER",
      );
    }

    try {
      const whereClause: any = {};

      if (email && phone) {
        whereClause.OR = [{ email }, { phone }];
      } else if (email) {
        whereClause.email = email;
      } else if (phone) {
        whereClause.phone = phone;
      }

      const user = await prisma.users.findFirst({
        where: whereClause,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          user_type: true,
          created_at: true,
        },
      });

      if (user) {
        return ApiResponseHandler.success(
          res,
          {
            exists: true,
            user: {
              id: user.id,
              email: user.email,
              phone: user.phone,
              name: user.name,
              user_type: user.user_type,
            },
          },
          "User found",
          200,
        );
      } else {
        return ApiResponseHandler.success(
          res,
          {
            exists: false,
            user: null,
          },
          "User not found",
          200,
        );
      }
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // Health check endpoint.
  // "healthy" means the API process is up and serving. A Redis outage only makes
  // OTP fall back to in-memory storage (degraded, not down), so we still return
  // 200 and surface the degradation in the body rather than failing the check.
  static async healthCheck(req: Request, res: Response) {
    let stats = { activeOTPs: 0, redisEnabled: false };
    let note: string | undefined;
    try {
      stats = await otpManager.getStats();
    } catch (err: any) {
      note = err?.message || "otp stats unavailable";
      console.warn("[health] otp stats unavailable:", note);
    }

    ApiResponseHandler.success(
      res,
      {
        status: stats.redisEnabled ? "healthy" : "degraded",
        otp_manager: {
          active_otps: stats.activeOTPs,
          redis_enabled: stats.redisEnabled,
          ...(note ? { note } : {}),
        },
        timestamp: new Date().toISOString(),
      },
      "Service is healthy",
    );
  }
}
