import { Router } from "express";
import { PaymentController } from "../controllers/paymentController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// ============ PAYMENT ROUTES ============

/**
 * @route   POST /api/payments/create-order/:courseId
 * @desc    Create Razorpay order for course enrollment
 * @access  Protected (USER)
 */
router.post("/create-order/:courseId", jwtAuth, PaymentController.createOrder);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify payment and create enrollment
 * @access  Protected (USER)
 */
router.post("/verify", jwtAuth, PaymentController.verifyPayment);

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay webhook handler
 * @access  Public (Razorpay webhook)
 */
router.post("/webhook", PaymentController.handleWebhook);

/**
 * @route   GET /api/payments/my-transactions
 * @desc    Get user's transaction history
 * @access  Protected
 */
router.get("/my-transactions", jwtAuth, PaymentController.getMyTransactions);

/**
 * @route   GET /api/payments/creator-sales
 * @desc    Get creator's sales/transactions
 * @access  Protected (Creator)
 */
router.get("/creator-sales", jwtAuth, PaymentController.getCreatorSales);

export default router;

