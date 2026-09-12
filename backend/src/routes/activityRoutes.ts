import { Router } from "express";
import { ActivityController } from "../controllers/activityController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

/**
 * @route   GET /activity/streak/me
 * @desc    Get the current user's learning streak + this week's activity grid
 * @access  Protected
 */
router.get("/streak/me", jwtAuth, ActivityController.getMyStreak);

export default router;