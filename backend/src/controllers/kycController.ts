import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
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
      console.log("digioData-----", JSON.stringify(digioData, null, 2));

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

      // Save verification attempt (if kyc_verifications table exists)
      try {
        await prisma.$executeRaw`
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, unique_request_id, created_at, updated_at)
          VALUES (gen_random_uuid(), ${userId}, ${pan_number.toUpperCase()}, 'PENDING', 'PAN', ${JSON.stringify(panDetails)}::jsonb, ${uniqueRequestId}, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
      } catch (dbError) {
        // Table might not exist yet, just log and continue
        console.log("KYC verification table not found, skipping database save");
      }

      let updatedUser = null;
      try {
        const userResult = await prisma.$queryRaw<Array<{
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
            kyc_verified_at, kyc_verification_id, 
            user_type, created_at, updated_at, last_login
          FROM users
          WHERE id = ${userId}
        `;
        updatedUser = userResult[0] || null;
      } catch (userError) {
        console.log("Error fetching user data:", userError);
      }

      return ApiResponseHandler.success(
        res,
        {
          pan_details: panDetails,
          verification_id: uniqueRequestId,
          user: updatedUser,
        },
        "PAN verified successfully"
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
      const nameMatch = digioData.name_as_per_pan_match === "MATCHED";
      const dobMatch = digioData.date_of_birth_match === "MATCHED";

      // Manual name comparison as fallback
      const normalizeName = (name: string) =>
        name.toUpperCase().trim().replace(/\s+/g, " ");

      const panName = normalizeName(panDetails.name);
      const userName = normalizeName(user_name);

      const manualNameMatch = panName === userName;
      const finalNameMatch =
        nameMatch ||
        (digioData.name_as_per_pan_match === undefined && manualNameMatch);
      const finalDobMatch =
        dobMatch || digioData.date_of_birth_match === undefined;

      const verified = finalNameMatch && finalDobMatch;

      // Save KYC verification record
      try {
        const kycRecordId = uuidv4();
        await prisma.$executeRaw`
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, match_details, unique_request_id, verified_at, created_at, updated_at)
          VALUES (${kycRecordId}, ${userId}, ${pan_number.toUpperCase()}, ${verified ? "VERIFIED" : "FAILED"}, 'PAN', ${JSON.stringify(panDetails)}::jsonb, ${JSON.stringify({ name_match: finalNameMatch, dob_match: finalDobMatch })}::jsonb, ${uniqueRequestId}, ${verified ? new Date() : null}, NOW(), NOW())
        `;

        // Update user KYC status
        if (verified) {
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
          await prisma.$executeRaw`
            UPDATE users 
            SET kyc_status = 'FAILED',
                kyc_verification_id = ${kycRecordId}
            WHERE id = ${userId}
          `;
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
            failure_reason: verified
              ? null
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
      console.log("Digio Bank Verification Response:", JSON.stringify(digioData, null, 2));

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
        await prisma.$executeRaw`
          INSERT INTO kyc_verifications (id, user_id, pan_number, status, verification_type, pan_details, unique_request_id, created_at, updated_at)
          VALUES (gen_random_uuid(), ${userId}, NULL, ${bankDetails.verified ? "VERIFIED" : "FAILED"}, 'BANK_ACCOUNT', ${JSON.stringify(bankDetails)}::jsonb, ${uniqueRequestId}, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;
      } catch (dbError) {
        console.log("KYC verification table not found, skipping database save");
      }

      return ApiResponseHandler.success(
        res,
        {
          bank_verification: bankDetails,
          verification_id: uniqueRequestId,
          account_number: account_number.replace(/(\d{4})\d+(\d{4})/, "$1****$2"), // Mask account number
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
}

