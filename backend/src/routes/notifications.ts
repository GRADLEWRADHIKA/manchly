import { Router } from "express";
import { NotificationController } from "../controllers/notificationController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

/**
 * @route   GET /notifications/creator
 * @desc    Get creator notifications (paginated, optionally filtered by type)
 * @access  Protected
 */
router.get("/creator", jwtAuth, NotificationController.getCreatorNotifications);

/**
 * @route   GET /notifications/user
 * @desc    Get user notifications (paginated, optionally filtered by type)
 * @access  Protected
 */
router.get("/user", jwtAuth, NotificationController.getUserNotifications);

/**
 * @route   GET /notifications/unread-count
 * @desc    Get unread notification count
 * @access  Protected
 */
router.get("/unread-count", jwtAuth, NotificationController.getUnreadCount);

/**
 * @route   PUT /notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Protected
 */
router.put("/read-all", jwtAuth, NotificationController.markAllAsRead);

/**
 * @route   PUT /notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Protected
 */
router.put("/:id/read", jwtAuth, NotificationController.markAsRead);

export default router;
