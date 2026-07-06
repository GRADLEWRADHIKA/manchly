import { Router } from "express";
import { SubscriptionController } from "../controllers/subscriptionController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

router.use(jwtAuth);

/**
 * @route   GET /subscriptions/me
 * @desc    Get current user's premium subscription status
 * @access  Protected
 */
router.get("/me", SubscriptionController.getMySubscription);

/**
 * @route   POST /subscriptions/checkout
 * @desc    Create Cashfree checkout for premium upgrade
 * @access  Protected (Brand/Agency)
 */
router.post("/checkout", SubscriptionController.createCheckout);

/**
 * @route   POST /subscriptions/verify
 * @desc    Verify premium payment and activate subscription
 * @access  Protected
 */
router.post("/verify", SubscriptionController.verifyCheckout);

export default router;
