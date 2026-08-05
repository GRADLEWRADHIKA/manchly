import { Router } from "express";
import { WebinarController } from "../controllers/webinarController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// ============ WEBINAR ROUTES ============

/**
 * @route   POST /api/webinars
 * @desc    Create a new webinar (Creator only)
 * @access  Protected (Creator)
 */
router.post("/", jwtAuth, WebinarController.createWebinar);

/**
 * @route   GET /api/webinars
 * @desc    Get all webinars (filtered by user type)
 * @access  Protected
 */
router.get("/", jwtAuth, WebinarController.getAllWebinars);

/**
 * @route   GET /api/webinars/:webinarId
 * @desc    Get single webinar by ID
 * @access  Protected
 */
router.get("/:webinarId", jwtAuth, WebinarController.getWebinarById);

/**
 * @route   PUT /api/webinars/:webinarId
 * @desc    Update webinar (Creator only - own webinars)
 * @access  Protected (Creator)
 */
router.put("/:webinarId", jwtAuth, WebinarController.updateWebinar);

/**
 * @route   DELETE /api/webinars/:webinarId
 * @desc    Delete webinar (Creator only - own webinars)
 * @access  Protected (Creator)
 */
router.delete("/:webinarId", jwtAuth, WebinarController.deleteWebinar);

// ============ PAYMENT & ENROLLMENT ROUTES ============

/**
 * @route   POST /api/webinars/:webinarId/enroll
 * @desc    Create Razorpay order for webinar enrollment
 * @access  Protected (USER)
 */
router.post("/:webinarId/enroll", jwtAuth, WebinarController.createWebinarOrder);

/**
 * @route   POST /api/webinars/payment/verify
 * @desc    Verify payment and create webinar enrollment
 * @access  Protected (USER)
 */
router.post("/payment/verify", jwtAuth, WebinarController.verifyWebinarPayment);

/**
 * @route   POST /api/webinars/:webinarId/grant
 * @desc    Manually grant a user access to a webinar without payment (Creator-owner or Admin)
 * @access  Protected (Creator/Admin)
 */
router.post("/:webinarId/grant", jwtAuth, WebinarController.grantWebinarAccess);

/**
 * @route   POST /api/webinars/:webinarId/review
 * @desc    Submit or update a review for a webinar (enrolled users only)
 * @access  Protected (USER)
 */
router.post("/:webinarId/review", jwtAuth, WebinarController.reviewWebinar);

/**
 * @route   GET /api/webinars/:webinarId/reviews
 * @desc    List reviews for a webinar
 * @access  Protected
 */
router.get("/:webinarId/reviews", jwtAuth, WebinarController.getWebinarReviews);

/**
 * @route   POST /api/webinars/:webinarId/publish-recording
 * @desc    Publish a webinar's recording as a course + auto-enroll registrants (owner/admin)
 * @access  Protected (Creator/Admin)
 */
router.post("/:webinarId/publish-recording", jwtAuth, WebinarController.publishRecording);

/**
 * @route   GET /api/webinars/enrolled/me
 * @desc    Get user's enrolled webinars
 * @access  Protected
 */
router.get("/enrolled/me", jwtAuth, WebinarController.getEnrolledWebinars);

// ============ STATISTICS ROUTES ============

/**
 * @route   GET /api/webinars/stats/creator
 * @desc    Get creator webinar statistics
 * @access  Protected (Creator)
 */
router.get("/stats/creator", jwtAuth, WebinarController.getCreatorWebinarStats);

export default router;

