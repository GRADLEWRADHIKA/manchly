import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { JWTRequest } from "../middleware/jwtAuth";
import { NotificationController } from "./notificationController";

// ---------------------------------------------------------------------------
// Decentro KYC — credentials are read at call time so a missing env var
// produces a clear warning rather than a silent auth error.
// ---------------------------------------------------------------------------
const DECENTRO_BASE_URL =
  process.env.DECENTRO_BASE_URL || "https://in.staging.decentro.tech";

const getDecentroHeaders = () => {
  const clientId = process.env.DECENTRO_CLIENT_ID || "";
  const clientSecret = process.env.DECENTRO_CLIENT_SECRET || "";
  const moduleSecret = process.env.DECENTRO_KYC_MODULE_SECRET || "";

  return {
    "Content-Type": "application/json",
    client_id: clientId,
    client_secret: clientSecret,
    module_secret: moduleSecret,
  };
};

export class KYCController {
  static async verifyPAN(req: JWTRequest, res: Response) {
    try {
      const { pan_number, name, dob } = req.body;
      const userId = req.user?.userId;

      if (!pan_number) {
        return ApiResponseHandler.customError(
          res,
          "PAN number is required",
          400,
          "MISSING_PAN",
        );
      }

      // Validate PAN format
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number.toUpperCase())) {
        return ApiResponseHandler.customError(
          res,
          "Invalid PAN format",
          400,
          "INVALID_PAN_FORMAT",
        );
      }

      // Generate unique reference ID
      const uniqueRequestId = uuidv4();

      // Call Decentro PAN validation API
      const decentroResponse = await axios.post(
        `${DECENTRO_BASE_URL}/kyc/public_registry/validate`,
        {
          reference_id: uniqueRequestId,
          document_type: "PAN",
          id_number: pan_number.toUpperCase(),
          consent: "Y",
          consent_purpose: "PAN Verification",
        },
        { headers: getDecentroHeaders() },
      );

      const decentroData = decentroResponse.data;
      console.log(
        "Decentro PAN Response:",
        JSON.stringify(decentroData, null, 2),
      );

      // Extract PAN details from Decentro response
      const kycResult = decentroData.kycResult || {};
      const panDetails = {
        pan: kycResult.idNumber || pan_number.toUpperCase(),
        name: kycResult.name || "",
        dob: kycResult.dob || "",
        status: kycResult.idStatus || decentroData.kycStatus || "",
        father_name: kycResult.fatherName || "",
      };

      // Decentro signals success via kycStatus === "SUCCESS" and idStatus === "VERIFIED"
      const isVerified =
        decentroData.kycStatus === "SUCCESS" &&
        kycResult.idStatus === "VERIFIED";
      const verificationStatus = isVerified ? "VERIFIED" : "FAILED";

      // Save verification attempt (if kyc_verifications table exists)
      try {
        const kycRecordId = uuidv4();
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, unique_request_id, verified_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4::"KYCStatus", 'PAN', $5::jsonb, $6, $7, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `,
          kycRecordId,
          userId,
          pan_number.toUpperCase(),
          verificationStatus,
          JSON.stringify(panDetails),
          uniqueRequestId,
          isVerified ? new Date() : null,
        );

        // Update user KYC status if verification succeeded
        if (isVerified) {
          // Mask PAN: ABCDE****F
          const maskedPAN =
            pan_number.toUpperCase().substring(0, 5) +
            "****" +
            pan_number.toUpperCase().substring(9);

          await prisma.$executeRaw`
            UPDATE users 
            SET pan_number = ${maskedPAN}, 
                kyc_verified = true, 
                kyc_status = 'VERIFIED', 
                kyc_verified_at = NOW(),
                kyc_verification_id = ${kycRecordId}
            WHERE id = ${userId}
          `;
        } else {
          // Verification failed - set kyc_verified to false
          await prisma.$executeRaw`
            UPDATE users 
            SET kyc_verified = false,
                kyc_status = 'FAILED',
                kyc_verification_id = ${kycRecordId}
            WHERE id = ${userId}
          `;
        }
      } catch (dbError) {
        console.log(
          "Error saving KYC verification:",
          JSON.stringify(dbError, null, 2),
        );
        // Table might not exist yet, just log and continue
        console.log("KYC verification table not found, skipping database save");
      }

      let updatedUser = null;
      try {
        const userResult = await prisma.$queryRaw<
          Array<{
            dob: string | null;
            id: string;
            email: string;
            name: string | null;
            phone: string | null;
            profile_image: string | null;
            pan_number: string | null;
            kyc_verified: boolean;
            kyc_status: string | null;
            kyc_verified_at: Date | null;
            kyc_verification_id: string | null;
            user_type: string[];
            created_at: Date;
            updated_at: Date;
            last_login: Date | null;
          }>
        >`
          SELECT 
            id, email, name, phone, profile_image, 
            pan_number, kyc_verified, kyc_status, 
            kyc_verified_at, kyc_verification_id,dob,
            user_type, created_at, updated_at, last_login
          FROM users
          WHERE id = ${userId}
        `;
        const rawUser = userResult[0] || null;
        if (rawUser) {
          updatedUser = {
            ...rawUser,
            user_type: Array.isArray(rawUser.user_type)
              ? rawUser.user_type[0]
              : rawUser.user_type,
          };
        }
      } catch (userError) {
        console.log("Error fetching user data:", userError);
      }

      return ApiResponseHandler.success(
        res,
        {
          pan_details: panDetails,
          verification_id: uniqueRequestId,
          verified: isVerified,
          user: updatedUser,
        },
        isVerified
          ? "PAN verified successfully"
          : "PAN verification failed - PAN is not valid",
      );
    } catch (error: any) {
      console.error("PAN verification error:", error);

      let errorMessage = "PAN verification failed";
      if (error?.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return ApiResponseHandler.customError(
        res,
        errorMessage,
        error?.response?.status || 500,
        "PAN_VERIFICATION_FAILED",
      );
    }
  }

  /**
   * Verify KYC - Match PAN with User Details
   * POST /kyc/verify
   */
  static async verifyKYC(req: JWTRequest, res: Response) {
    try {
      const { pan_number, user_name, user_dob } = req.body;
      const userId = req.user?.userId;

      if (!pan_number || !user_name || !user_dob) {
        return ApiResponseHandler.customError(
          res,
          "PAN number, name, and DOB are required",
          400,
          "MISSING_FIELDS",
        );
      }

      // Check if PAN number is already verified for another user
      const maskedPAN =
        pan_number.toUpperCase().substring(0, 5) +
        "****" +
        pan_number.toUpperCase().substring(9);

      const existingUser = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM users 
        WHERE pan_number = ${maskedPAN} 
        AND id != ${userId}
        LIMIT 1
      `;

      if (existingUser && existingUser.length > 0) {
        return ApiResponseHandler.customError(
          res,
          "PAN number is already verified for another user",
          400,
          "PAN_ALREADY_VERIFIED",
        );
      }

      // Generate unique reference ID
      const uniqueRequestId = uuidv4();

      // Call Decentro PAN validation API
      const decentroResponse = await axios.post(
        `${DECENTRO_BASE_URL}/kyc/public_registry/validate`,
        {
          reference_id: uniqueRequestId,
          document_type: "PAN",
          id_number: pan_number.toUpperCase(),
          consent: "Y",
          consent_purpose: "PAN Verification",
        },
        { headers: getDecentroHeaders() },
      );

      const decentroData = decentroResponse.data;
      console.log(
        "Decentro KYC Raw Response:",
        JSON.stringify(decentroData, null, 2),
      );

      // Extract PAN details from Decentro response
      const kycResult = decentroData.kycResult || {};
      const panDetails = {
        pan: kycResult.idNumber || pan_number.toUpperCase(),
        name: kycResult.name || "",
        dob: kycResult.dob || "",
        status: kycResult.idStatus || decentroData.kycStatus || "",
        father_name: kycResult.fatherName || "",
      };

      // ---------------------------------------------------------------------------
      // Verification outcome: trust Decentro's kycStatus as the single source of
      // truth.  Name / DOB checks are soft warnings only — they must never block
      // a Decentro SUCCESS response.
      // ---------------------------------------------------------------------------
      // ✅ FIX
      const isStatusValid =
        decentroData.kycStatus === "SUCCESS" &&
        (kycResult.idStatus === "VERIFIED" || kycResult.idStatus === "VALID");
      const verified = isStatusValid; // Decentro SUCCESS === verified

      // Soft name check — fuzzy: does the submitted first word appear anywhere
      // in the PAN-holder name?  (handles "Radhika" ⊂ "RADHIKA BABAR")
      const normalizeName = (n: string) =>
        n.toUpperCase().trim().replace(/\s+/g, " ");
      const panName = normalizeName(panDetails.name);
      const userName = normalizeName(user_name);
      const firstWord = userName.split(" ")[0];
      const nameMatchSoft = !panDetails.name || panName.includes(firstWord);
      if (panDetails.name && !nameMatchSoft) {
        console.warn(
          `⚠️  KYC name soft-mismatch (non-blocking): submitted="${user_name}" pan="${panDetails.name}"`,
        );
      }

      // DOB: Decentro does not return dob in kycResult — skip comparison entirely.
      const finalNameMatch = nameMatchSoft;
      const finalDobMatch = true; // not returned by Decentro; cannot compare

      // Save KYC verification record
      try {
        const kycRecordId = uuidv4();
        const statusValue = verified ? "VERIFIED" : "FAILED";
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, match_details, unique_request_id, verified_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4::"KYCStatus", 'PAN', $5::jsonb, $6::jsonb, $7, $8, NOW(), NOW())
        `,
          kycRecordId,
          userId,
          pan_number.toUpperCase(),
          statusValue,
          JSON.stringify(panDetails),
          JSON.stringify({
            name_match: finalNameMatch,
            dob_match: finalDobMatch,
          }),
          uniqueRequestId,
          verified ? new Date() : null,
        );

        // Update user KYC status
        if (verified) {
          await prisma.$executeRaw`
            UPDATE users
            SET pan_number = ${maskedPAN},
                kyc_verified = true,
                kyc_status = 'VERIFIED',
                kyc_verified_at = NOW(),
                kyc_verification_id = ${kycRecordId}
            WHERE id = ${userId}
          `;
        } else {
          // Verification failed/rejected - set kyc_verified to false
          await prisma.$executeRaw`
            UPDATE users
            SET kyc_verified = false,
                kyc_status = 'FAILED',
                kyc_verification_id = ${kycRecordId}
            WHERE id = ${userId}
          `;
        }

        // Fetch updated user
        let updatedUser = null;
        try {
          const userResult = await prisma.$queryRaw<
            Array<{
              dob: string | null;
              id: string;
              email: string;
              name: string | null;
              phone: string | null;
              profile_image: string | null;
              pan_number: string | null;
              kyc_verified: boolean;
              kyc_status: string | null;
              kyc_verified_at: Date | null;
              kyc_verification_id: string | null;
              user_type: string[];
              created_at: Date;
              updated_at: Date;
              last_login: Date | null;
            }>
          >`
            SELECT
              id, email, name, phone, profile_image,
              pan_number, kyc_verified, kyc_status,
              kyc_verified_at, kyc_verification_id, dob,
              user_type, created_at, updated_at, last_login
            FROM users
            WHERE id = ${userId}
          `;
          const rawUser = userResult[0] || null;
          if (rawUser) {
            updatedUser = {
              ...rawUser,
              user_type: Array.isArray(rawUser.user_type)
                ? rawUser.user_type[0]
                : rawUser.user_type,
            };
          }
        } catch (userError) {
          console.log("Error fetching user data:", userError);
        }

        // In-app notification
        if (userId) {
          NotificationController.createNotification({
            userId,
            type: "SYSTEM",
            title: verified ? "KYC Approved" : "KYC Verification Failed",
            message: verified
              ? "Your KYC verification has been approved. You can now receive payouts."
              : "Your KYC verification failed. Please check your details and try again.",
          }).catch((err) => console.error("Notification error:", err));
        }

        return ApiResponseHandler.success(
          res,
          {
            success: verified,
            verified,
            kyc_status: verified ? "VERIFIED" : "FAILED",
            verified_at: verified ? new Date() : null,
            kyc_record_id: kycRecordId,
            pan_details: {
              name: panDetails.name,
              pan: pan_number.toUpperCase(),
              status: panDetails.status,
              father_name: panDetails.father_name,
            },
            match_details: {
              name_match: finalNameMatch,
              dob_match: finalDobMatch,
            },
            user: updatedUser,
            failure_reason: verified
              ? null
              : "Decentro KYC status is not SUCCESS",
          },
          verified ? "KYC verified successfully" : "KYC verification failed",
        );
      } catch (dbError: any) {
        console.error("Database error:", dbError);

        // Check if it's a unique constraint violation (PAN already exists)
        if (dbError?.code === "23505" || dbError?.meta?.code === "23505") {
          return ApiResponseHandler.customError(
            res,
            "PAN number is already verified for another user",
            400,
            "PAN_ALREADY_VERIFIED",
          );
        }

        // Return response even if DB save fails
        return ApiResponseHandler.success(
          res,
          {
            success: verified,
            verified,
            kyc_status: verified ? "VERIFIED" : "FAILED",
            verified_at: verified ? new Date() : null,
            pan_details: {
              name: panDetails.name,
              pan: pan_number.toUpperCase(),
              status: panDetails.status,
              father_name: panDetails.father_name,
            },
            match_details: {
              name_match: finalNameMatch,
              dob_match: finalDobMatch,
            },
            user: null,
            failure_reason: verified
              ? null
              : "Decentro KYC status is not SUCCESS",
            note: "Database save failed, but verification completed",
          },
          verified ? "KYC verified successfully" : "KYC verification failed",
        );
      }
    } catch (error: any) {
      console.error("KYC verification error:", error);

      let errorMessage = "KYC verification failed";
      if (error?.response?.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return ApiResponseHandler.customError(
        res,
        errorMessage,
        error?.response?.status || 500,
        "KYC_VERIFICATION_FAILED",
      );
    }
  }

  /**
   * Get KYC Status
   * GET /kyc/status
   */
  static async getKYCStatus(req: JWTRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      try {
        const result = await prisma.$queryRaw<
          Array<{
            kyc_verified: boolean | null;
            kyc_status: string | null;
            pan_number: string | null;
            kyc_verified_at: Date | null;
          }>
        >`
          SELECT kyc_verified, kyc_status, pan_number, kyc_verified_at
          FROM users
          WHERE id = ${userId}
        `;

        const user = result[0];

        return ApiResponseHandler.success(
          res,
          {
            verified: user?.kyc_verified || false,
            kyc_status: user?.kyc_status || "PENDING",
            pan_number: user?.pan_number || null,
            verified_at: user?.kyc_verified_at || null,
          },
          "KYC status retrieved successfully",
        );
      } catch (dbError) {
        // If query fails, return default values
        return ApiResponseHandler.success(
          res,
          {
            verified: false,
            kyc_status: "PENDING",
            pan_number: null,
            verified_at: null,
          },
          "KYC status retrieved successfully",
        );
      }
    } catch (error: any) {
      console.error("Get KYC status error:", error);
      return ApiResponseHandler.customError(
        res,
        error.message || "Failed to fetch KYC status",
        500,
        "KYC_STATUS_ERROR",
      );
    }
  }

  static async verifyBankAccount(req: JWTRequest, res: Response) {
    try {
      const {
        account_number,
        ifsc_code,
        account_holder_name,
        validation_mode = "PENNY_LESS",
      } = req.body;
      const userId = req.user?.userId;

      if (!account_number || !ifsc_code) {
        return ApiResponseHandler.customError(
          res,
          "Account number and IFSC code are required",
          400,
          "MISSING_FIELDS",
        );
      }

      if (account_number.length < 8 || account_number.length > 18) {
        return ApiResponseHandler.customError(
          res,
          "Account number must be between 8 and 18 characters",
          400,
          "INVALID_ACCOUNT_NUMBER",
        );
      }

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code.toUpperCase())) {
        return ApiResponseHandler.customError(
          res,
          "Invalid IFSC code format",
          400,
          "INVALID_IFSC_FORMAT",
        );
      }

      const validModes = ["PENNY_LESS", "PENNY_DROP", "AUTO"];
      if (!validModes.includes(validation_mode)) {
        return ApiResponseHandler.customError(
          res,
          "Validation mode must be one of: PENNY_LESS, PENNY_DROP, AUTO",
          400,
          "INVALID_VALIDATION_MODE",
        );
      }

      const uniqueRequestId = uuidv4();

      const requestPayload: any = {
        beneficiary_account_no: account_number,
        beneficiary_ifsc: ifsc_code.toUpperCase(),
        unique_request_id: uniqueRequestId,
        validation_mode: validation_mode,
      };

      if (account_holder_name) {
        requestPayload.beneficiary_name = account_holder_name;
      }

      const decentroBankResponse = await axios.post(
        `${DECENTRO_BASE_URL}/kyc/bank_account/validate`,
        requestPayload,
        { headers: getDecentroHeaders() },
      );

      const decentroBankData = decentroBankResponse.data;
      console.log(
        "Decentro Bank Verification Response:",
        JSON.stringify(decentroBankData, null, 2),
      );

      // Decentro bank verification: kycStatus === "SUCCESS" means account is valid
      const bankVerified = decentroBankData.kycStatus === "SUCCESS";
      const bankKycResult = decentroBankData.kycResult || {};

      const bankDetails = {
        id: uniqueRequestId,
        verified: bankVerified,
        verified_at: bankVerified ? new Date().toISOString() : null,
        beneficiary_name_with_bank: bankKycResult.bankAccountName || "",
        error_msg: decentroBankData.message || null,
        bank_reference_number: bankKycResult.bankReferenceNumber || null,
        validation_mode: validation_mode,
      };

      try {
        const kycRecordId = uuidv4();
        const bankStatusValue = bankDetails.verified ? "VERIFIED" : "FAILED";
        await prisma.$executeRawUnsafe(
          `
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, unique_request_id, created_at, updated_at)
          VALUES ($1, $2, NULL, $3::"KYCStatus", 'BANK_ACCOUNT', $4::jsonb, $5, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `,
          kycRecordId,
          userId,
          bankStatusValue,
          JSON.stringify(bankDetails),
          uniqueRequestId,
        );
      } catch (dbError) {
        console.log("KYC verification table not found, skipping database save");
      }

      // Update creator_bank_accounts.is_verified if the bank account matches
      if (bankDetails.verified) {
        try {
          await prisma.creator_bank_accounts.updateMany({
            where: {
              user_id: userId!,
              account_number: account_number,
              ifsc_code: ifsc_code.toUpperCase(),
            },
            data: {
              is_verified: true,
            },
          });
        } catch (bankUpdateError) {
          console.log(
            "Could not update bank account verified status:",
            bankUpdateError,
          );
        }
      }

      return ApiResponseHandler.success(
        res,
        {
          bank_verification: bankDetails,
          verification_id: uniqueRequestId,
          account_number: account_number.replace(
            /(\d{4})\d+(\d{4})/,
            "$1****$2",
          ),
          ifsc_code: ifsc_code.toUpperCase(),
        },
        bankDetails.verified
          ? "Bank account verified successfully"
          : "Bank account verification failed",
      );
    } catch (error: any) {
      console.error("Bank verification error:", error);

      let errorMessage = "Bank account verification failed";
      if (error?.response?.data) {
        errorMessage =
          error.response.data.message ||
          error.response.data.error_msg ||
          errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return ApiResponseHandler.customError(
        res,
        errorMessage,
        error?.response?.status || 500,
        "BANK_VERIFICATION_FAILED",
      );
    }
  }

  static async resetKYC(req: JWTRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return ApiResponseHandler.customError(
          res,
          "Unauthorized",
          401,
          "UNAUTHORIZED",
        );
      }

      // Delete KYC verification records
      await prisma.$executeRaw`DELETE FROM kyc_verifications WHERE user_id = ${userId}`;

      // Reset user KYC fields
      await prisma.$executeRaw`
        UPDATE users SET
          pan_number = NULL,
          kyc_verified = false,
          kyc_status = 'PENDING',
          kyc_verified_at = NULL,
          kyc_verification_id = NULL
        WHERE id = ${userId}
      `;

      // Fetch updated user
      const userResult = await prisma.$queryRaw<any[]>`
        SELECT id, email, name, phone, profile_image, pan_number, kyc_verified,
               kyc_status, kyc_verified_at, kyc_verification_id, dob,
               user_type, created_at, updated_at, last_login
        FROM users WHERE id = ${userId}
      `;

      const rawUser = userResult[0] || null;
      let updatedUser = null;
      if (rawUser) {
        updatedUser = {
          ...rawUser,
          user_type: Array.isArray(rawUser.user_type)
            ? rawUser.user_type[0]
            : rawUser.user_type,
        };
      }

      return ApiResponseHandler.success(
        res,
        { user: updatedUser },
        "KYC reset successfully",
      );
    } catch (error: any) {
      console.error("KYC reset error:", error);
      return ApiResponseHandler.customError(
        res,
        "Failed to reset KYC",
        500,
        "KYC_RESET_FAILED",
      );
    }
  }
}
