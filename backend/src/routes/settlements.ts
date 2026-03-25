import { Router } from "express";
import { SettlementController } from "../controllers/settlementController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// ============ CREATOR ROUTES ============

/**
 * @route   POST /api/settlements/bank-account
 * @desc    Add or update creator bank account
 * @access  Protected (CREATOR)
 */
router.post("/bank-account", jwtAuth, SettlementController.addBankAccount);

/**
 * @route   GET /api/settlements/bank-account
 * @desc    Get creator bank account details
 * @access  Protected (CREATOR)
 */
router.get("/bank-account", jwtAuth, SettlementController.getBankAccount);

/**
 * @route   GET /api/settlements/wallet
 * @desc    Get creator wallet with pending T+2 entries and balances
 * @access  Protected (CREATOR)
 */
router.get("/wallet", jwtAuth, SettlementController.getWallet);

/**
 * @route   GET /api/settlements/my-settlements
 * @desc    Get creator's settlement history
 * @access  Protected (CREATOR)
 */
router.get("/my-settlements", jwtAuth, SettlementController.getCreatorSettlements);

/**
 * @route   GET /api/settlements/earnings-breakdown
 * @desc    Get unsettled earnings breakdown with estimated deductions
 * @access  Protected (CREATOR)
 */
router.get("/earnings-breakdown", jwtAuth, SettlementController.getEarningsBreakdown);

// ============ ADMIN ROUTES ============

/**
 * @route   GET /api/settlements/admin/all
 * @desc    Get all settlements (admin)
 * @access  Protected (ADMIN)
 */
router.get("/admin/all", jwtAuth, SettlementController.adminGetAllSettlements);

/**
 * @route   POST /api/settlements/admin/trigger
 * @desc    Manually trigger settlement processing
 * @access  Protected (ADMIN)
 */
router.post("/admin/trigger", jwtAuth, SettlementController.adminTriggerSettlements);

/**
 * @route   POST /api/settlements/admin/retry/:settlementId
 * @desc    Retry a failed settlement
 * @access  Protected (ADMIN)
 */
router.post("/admin/retry/:settlementId", jwtAuth, SettlementController.adminRetrySettlement);

/**
 * @route   POST /api/settlements/webhook/payout
 * @desc    Razorpay payout webhook handler
 * @access  Public (Razorpay webhook)
 */
router.post("/webhook/payout", SettlementController.handlePayoutWebhook);

// ============ PARAM ROUTES (must be last) ============

/**
 * @route   GET /api/settlements/:settlementId
 * @desc    Get settlement detail with line items
 * @access  Protected (CREATOR/ADMIN)
 */
router.get("/:settlementId", jwtAuth, SettlementController.getSettlementDetail);

export default router;
