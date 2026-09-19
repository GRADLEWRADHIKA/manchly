import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { NotificationController } from "./notificationController";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { JWTRequest } from "../middleware/jwtAuth";

const DIGIO_API_URL = "https://api.digio.in/v3/client/kyc/fetch_id_data";
const DIGIO_BANK_VERIFY_URL = "https://api.digio.in/v4/client/verify/bank_account";
const DIGIO_API_KEY = process.env.DIGIO_API_KEY || "";
const DIGIO_API_SECRET = process.env.DIGIO_API_SECRET || "";

// Create Basic Auth header
const getAuthHeader = () => {
  const credentials = Buffer.from(`${DIGIO_API_KEY}:${DIGIO_API_SECRET}`).toString("base64");
  return `Basic ${credentials}`;
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
          "MISSING_PAN"
        );
      }

      // Validate PAN format
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan_number.toUpperCase())) {
        return ApiResponseHandler.customError(
          res,
          "Invalid PAN format",
          400,
          "INVALID_PAN_FORMAT"
        );
      }

      // Generate unique request ID
      const uniqueRequestId = uuidv4();

      // Call Digio API
      const digioResponse = await axios.post(
        `${DIGIO_API_URL}/PAN`,
        {
          id_no: pan_number.toUpperCase(),
          name: name || undefined,
          dob: dob || undefined,
          unique_request_id: uniqueRequestId,
        },
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: getAuthHeader(),
          },
        }
      );

      const digioData = digioResponse.data;
      console.log("Digio PAN status:", { status: digioData.status, remarks: digioData.remarks });

      // Extract PAN details
      const panDetails = {
        pan: digioData.pan || pan_number.toUpperCase(),
        name: digioData.name || "",
        date_of_birth_match: digioData.date_of_birth_match || "",
        name_as_per_pan_match: digioData.name_as_per_pan_match || "",
        status: digioData.status || "",
        category: digioData.category || "",
        remarks: digioData.remarks || "",
      };

      // Check if verification was successful
      const isVerified = digioData.status === "valid" || digioData.status === "VALID";
      const verificationStatus = isVerified ? "VERIFIED" : "FAILED";

      // Save verification attempt (if kyc_verifications table exists)
      try {
        const kycRecordId = uuidv4();
        await prisma.$executeRawUnsafe(`
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, unique_request_id, verified_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4::"KYCStatus", 'PAN', $5::jsonb, $6, $7, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, kycRecordId, userId, pan_number.toUpperCase(), verificationStatus, JSON.stringify(panDetails), uniqueRequestId, isVerified ? new Date() : null);

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
        console.log("Error saving KYC verification:", JSON.stringify(dbError, null, 2));
        // Table might not exist yet, just log and continue
        console.log("KYC verification table not found, skipping database save");
      }

      let updatedUser = null;
      try {
        const userResult = await prisma.$queryRaw<Array<{
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
        }>>`
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
            user_type: Array.isArray(rawUser.user_type) ? rawUser.user_type[0] : rawUser.user_type,
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
          : "PAN verification failed - PAN is not valid"
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
        "PAN_VERIFICATION_FAILED"
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
          "MISSING_FIELDS"
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
          "PAN_ALREADY_VERIFIED"
        );
      }

      // Generate unique request ID
      const uniqueRequestId = uuidv4();

      // Call Digio API
      const digioResponse = await axios.post(
        `${DIGIO_API_URL}/PAN`,
        {
          id_no: pan_number.toUpperCase(),
          name: user_name,
          dob: user_dob, // Format: YYYY-MM-DD
          unique_request_id: uniqueRequestId,
        },
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: getAuthHeader(),
          },
        }
      );

      const digioData = digioResponse.data;
      console.log("Digio KYC status:", { status: digioData.status, remarks: digioData.remarks });
      console.log("Digio match fields - name_as_per_pan_match:", JSON.stringify(digioData.name_as_per_pan_match), "date_of_birth_match:", JSON.stringify(digioData.date_of_birth_match));

      // Extract PAN details
      const panDetails = {
        pan: digioData.pan || pan_number.toUpperCase(),
        name: digioData.name || "",
        date_of_birth_match: digioData.date_of_birth_match || "",
        name_as_per_pan_match: digioData.name_as_per_pan_match || "",
        status: digioData.status || "",
        category: digioData.category || "",
        remarks: digioData.remarks || "",
      };

      // Check matches from Digio response
      // Digio returns boolean true/false or string "MATCHED"/"NOT_MATCHED"
      const nameMatch = digioData.name_as_per_pan_match === true || digioData.name_as_per_pan_match === "MATCHED";
      const dobMatch = digioData.date_of_birth_match === true || digioData.date_of_birth_match === "MATCHED";

      // Check if fields are truly missing (undefined/null), not just false
      const nameFieldPresent = digioData.name_as_per_pan_match !== undefined && digioData.name_as_per_pan_match !== null;
      const dobFieldPresent = digioData.date_of_birth_match !== undefined && digioData.date_of_birth_match !== null;

      // Manual name comparison as fallback only when Digio doesn't return the field
      const normalizeName = (name: string) =>
        name.toUpperCase().trim().replace(/\s+/g, " ");

      const panName = normalizeName(panDetails.name);
      const userName = normalizeName(user_name);
      const manualNameMatch = panName === userName;

      // Name: trust Digio if field is present, otherwise fallback to manual comparison
      const finalNameMatch = nameFieldPresent
        ? nameMatch
        : (manualNameMatch || !panDetails.name);

      // DOB: trust Digio if field is present, otherwise skip check
      const finalDobMatch = dobFieldPresent ? dobMatch : true;

      const isStatusValid = digioData.status === "valid" || digioData.status === "VALID";
      const verified = isStatusValid && finalNameMatch && finalDobMatch;

      // Save KYC verification record
      try {
        const kycRecordId = uuidv4();
        const statusValue = verified ? "VERIFIED" : "FAILED";
        await prisma.$executeRawUnsafe(`
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, match_details, unique_request_id, verified_at, created_at, updated_at)
          VALUES ($1, $2, $3, $4::"KYCStatus", 'PAN', $5::jsonb, $6::jsonb, $7, $8, NOW(), NOW())
        `, kycRecordId, userId, pan_number.toUpperCase(), statusValue, JSON.stringify(panDetails), JSON.stringify({ name_match: finalNameMatch, dob_match: finalDobMatch }), uniqueRequestId, verified ? new Date() : null);

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

        // Fetch updated user
        let updatedUser = null;
        try {
          const userResult = await prisma.$queryRaw<Array<{
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
          }>>`
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
              user_type: Array.isArray(rawUser.user_type) ? rawUser.user_type[0] : rawUser.user_type,
            };
          }
        } catch (userError) {
          console.log("Error fetching user data:", userError);
        }

        return ApiResponseHandler.success(
          res,
          {
            verified,
            match_details: {
              name_match: finalNameMatch,
              dob_match: finalDobMatch,
            },
            pan_details: {
              name: panDetails.name,
              pan: pan_number.toUpperCase(),
              status: panDetails.status,
            },
            kyc_status: verified ? "VERIFIED" : "FAILED",
            verified_at: verified ? new Date() : null,
            kyc_record_id: kycRecordId,
            user: updatedUser,
            digio_raw_match: {
              name_as_per_pan_match: panDetails.name_as_per_pan_match,
              date_of_birth_match: panDetails.date_of_birth_match,
            },
            failure_reason: verified
              ? null
              : !finalNameMatch && !finalDobMatch
              ? "Name and date of birth mismatch"
              : !finalNameMatch
              ? "Name mismatch"
              : !finalDobMatch
              ? "Date of birth mismatch"
              : "Verification failed",
          },
          verified
            ? "KYC verified successfully"
            : "PAN details do not match user information"
        );
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        
        // Check if it's a unique constraint violation (PAN already exists)
        if (dbError?.code === '23505' || dbError?.meta?.code === '23505') {
          return ApiResponseHandler.customError(
            res,
            "PAN number is already verified for another user",
            400,
            "PAN_ALREADY_VERIFIED"
          );
        }
        
        // Return response even if DB save fails
        return ApiResponseHandler.success(
          res,
          {
            verified,
            match_details: {
              name_match: finalNameMatch,
              dob_match: finalDobMatch,
            },
            pan_details: {
              name: panDetails.name,
              pan: pan_number.toUpperCase(),
              status: panDetails.status,
            },
            kyc_status: verified ? "VERIFIED" : "FAILED",
            verified_at: verified ? new Date() : null,
            user: null,
            failure_reason: verified
              ? null
              : !finalNameMatch
              ? "Name mismatch"
              : !finalDobMatch
              ? "Date of birth mismatch"
              : "Verification failed",
            note: "Database save failed, but verification completed",
          },
          verified
            ? "KYC verified successfully"
            : "PAN details do not match user information"
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
        "KYC_VERIFICATION_FAILED"
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
        const result = await prisma.$queryRaw<Array<{
          kyc_verified: boolean | null;
          kyc_status: string | null;
          pan_number: string | null;
          kyc_verified_at: Date | null;
        }>>`
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
          "KYC status retrieved successfully"
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
          "KYC status retrieved successfully"
        );
      }
    } catch (error: any) {
      console.error("Get KYC status error:", error);
      return ApiResponseHandler.customError(
        res,
        error.message || "Failed to fetch KYC status",
        500,
        "KYC_STATUS_ERROR"
      );
    }
  }

  static async verifyBankAccount(req: JWTRequest, res: Response) {
    try {
      const { 
        account_number, 
        ifsc_code, 
        account_holder_name,
        validation_mode = "PENNY_LESS"
      } = req.body;
      const userId = req.user?.userId;

      if (!account_number || !ifsc_code) {
        return ApiResponseHandler.customError(
          res,
          "Account number and IFSC code are required",
          400,
          "MISSING_FIELDS"
        );
      }

      if (account_number.length < 8 || account_number.length > 18) {
        return ApiResponseHandler.customError(
          res,
          "Account number must be between 8 and 18 characters",
          400,
          "INVALID_ACCOUNT_NUMBER"
        );
      }

      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc_code.toUpperCase())) {
        return ApiResponseHandler.customError(
          res,
          "Invalid IFSC code format",
          400,
          "INVALID_IFSC_FORMAT"
        );
      }

      const validModes = ["PENNY_LESS", "PENNY_DROP", "AUTO"];
      if (!validModes.includes(validation_mode)) {
        return ApiResponseHandler.customError(
          res,
          "Validation mode must be one of: PENNY_LESS, PENNY_DROP, AUTO",
          400,
          "INVALID_VALIDATION_MODE"
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

      const digioResponse = await axios.post(
        DIGIO_BANK_VERIFY_URL,
        requestPayload,
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: getAuthHeader(),
          },
        }
      );

      const digioData = digioResponse.data;
      console.log("Digio bank status:", { verified: digioData.verified, status: digioData.status, remarks: digioData.remarks });

      const bankDetails = {
        id: digioData.id || uniqueRequestId,
        verified: digioData.verified || false,
        verified_at: digioData.verified_at || null,
        beneficiary_name_with_bank: digioData.beneficiary_name_with_bank || "",
        error_msg: digioData.error_msg || null,
        fuzzy_match_result: digioData.fuzzy_match_result || null,
        fuzzy_match_score: digioData.fuzzy_match_score || null,
        error_code: digioData.error_code || null,
        validation_mode: digioData.validation_mode || validation_mode,
      };

      try {
        const kycRecordId = uuidv4();
        const bankStatusValue = bankDetails.verified ? "VERIFIED" : "FAILED";
        await prisma.$executeRawUnsafe(`
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, unique_request_id, created_at, updated_at)
          VALUES ($1, $2, NULL, $3::"KYCStatus", 'BANK_ACCOUNT', $4::jsonb, $5, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, kycRecordId, userId, bankStatusValue, JSON.stringify(bankDetails), uniqueRequestId);
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
          console.log("Could not update bank account verified status:", bankUpdateError);
        }
      }

      return ApiResponseHandler.success(
        res,
        {
          bank_verification: bankDetails,
          verification_id: uniqueRequestId,
          account_number: account_number.replace(/(\d{4})\d+(\d{4})/, "$1****$2"),
          ifsc_code: ifsc_code.toUpperCase(),
        },
        bankDetails.verified
          ? "Bank account verified successfully"
          : "Bank account verification failed"
      );
    } catch (error: any) {
      console.error("Bank verification error:", error);

      let errorMessage = "Bank account verification failed";
      if (error?.response?.data) {
        errorMessage = error.response.data.message || error.response.data.error_msg || errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      return ApiResponseHandler.customError(
        res,
        errorMessage,
        error?.response?.status || 500,
        "BANK_VERIFICATION_FAILED"
      );
    }
  }

  static async resetKYC(req: JWTRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return ApiResponseHandler.customError(res, "Unauthorized", 401, "UNAUTHORIZED");
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
          user_type: Array.isArray(rawUser.user_type) ? rawUser.user_type[0] : rawUser.user_type,
        };
      }

      return ApiResponseHandler.success(res, { user: updatedUser }, "KYC reset successfully");
    } catch (error: any) {
      console.error("KYC reset error:", error);
      return ApiResponseHandler.customError(res, "Failed to reset KYC", 500, "KYC_RESET_FAILED");
    }
  }
}

