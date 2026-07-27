import { Router } from "express";
import { XtechAuthController } from "../controllers/xtechAuthController";
import { CourseController } from "../controllers/courseController";
import rateLimit from "express-rate-limit";

const router = Router();

const otpLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many requests, try again later.", code: "RATE_LIMIT" },
});

// ── Public (no auth) ──
router.post("/register", otpLimit, XtechAuthController.register);
router.post("/verify", otpLimit, XtechAuthController.verify);

// ── Protected (JWT + device check) ──
router.get("/me/courses", XtechAuthController.deviceAuth, CourseController.getEnrolledCourses);

export default router;
