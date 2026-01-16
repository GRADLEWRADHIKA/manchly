import { Router } from "express";
import { KYCController } from "../controllers/kycController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// ============ KYC ROUTES ============

/**
 * @route   POST /api/kyc/verify-pan
 * @desc    Verify PAN number using Digio API
 * @access  Protected
 */
router.post("/verify-pan", jwtAuth, KYCController.verifyPAN);

/**
 * @route   POST /api/kyc/verify
 * @desc    Verify KYC - Match PAN details with user details
 * @access  Protected
 */
router.post("/verify", jwtAuth, KYCController.verifyKYC);

/**
 * @route   GET /api/kyc/status
 * @desc    Get user's KYC verification status
 * @access  Protected
 */
router.get("/status", jwtAuth, KYCController.getKYCStatus);

export default router;

