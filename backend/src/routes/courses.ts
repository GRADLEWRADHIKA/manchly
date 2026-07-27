import { Router } from "express";
import { CourseController } from "../controllers/courseController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

// ============ PUBLIC ROUTES (no auth) ============

/**
 * @route   GET /courses/public
 * @desc    List published courses (optionally filtered by creator_id)
 * @access  Public
 */
router.get("/public", CourseController.getPublicCourses);

// ============ COURSE ROUTES ============

/**
 * @route   POST /api/courses
 * @desc    Create a new course (Creator only)
 * @access  Protected (Creator)
 */
router.post("/", jwtAuth, CourseController.createCourse);

/**
 * @route   GET /api/courses
 * @desc    Get all courses (filtered by user type)
 * @access  Protected
 */
router.get("/", jwtAuth, CourseController.getAllCourses);

/**
 * @route   GET /api/courses/:courseId
 * @desc    Get single course by ID
 * @access  Protected
 */
router.get("/:courseId", jwtAuth, CourseController.getCourseById);

/**
 * @route   PUT /api/courses/:courseId
 * @desc    Update course (Creator only - own courses)
 * @access  Protected (Creator)
 */
router.put("/:courseId", jwtAuth, CourseController.updateCourse);

/**
 * @route   DELETE /api/courses/:courseId
 * @desc    Delete course (Creator only - own courses)
 * @access  Protected (Creator)
 */
router.delete("/:courseId", jwtAuth, CourseController.deleteCourse);

// ============ VIDEO ROUTES ============

/**
 * @route   POST /api/courses/:courseId/videos
 * @desc    Create direct upload URL for video (Creator only)
 * @access  Protected (Creator)
 */
router.post("/:courseId/videos", jwtAuth, CourseController.createVideoUpload);

/**
 * @route   GET /api/courses/videos/:videoId/status
 * @desc    Get video upload status
 * @access  Protected
 */
router.get("/videos/:videoId/status", jwtAuth, CourseController.getVideoUploadStatus);

/**
 * @route   PUT /api/courses/videos/:videoId
 * @desc    Update video details (Creator only)
 * @access  Protected (Creator)
 */
router.put("/videos/:videoId", jwtAuth, CourseController.updateVideo);

/**
 * @route   DELETE /api/courses/videos/:videoId
 * @desc    Delete video (Creator only)
 * @access  Protected (Creator)
 */
router.delete("/videos/:videoId", jwtAuth, CourseController.deleteVideo);

// ============ ENROLLMENT ROUTES ============

/**
 * @route   POST /api/courses/:courseId/enroll
 * @desc    Enroll in a course (USER only)
 * @access  Protected (USER)
 */
router.post("/:courseId/enroll", jwtAuth, CourseController.enrollInCourse);

/**
 * @route   GET /api/courses/enrolled
 * @desc    Get user's enrolled courses
 * @access  Protected
 */
router.get("/enrolled/me", jwtAuth, CourseController.getEnrolledCourses);

/**
 * @route   PUT /api/courses/:courseId/progress
 * @desc    Update enrollment progress
 * @access  Protected
 */
router.put("/:courseId/progress", jwtAuth, CourseController.updateProgress);

/**
 * @route   DELETE /api/courses/:courseId/enroll
 * @desc    Unenroll from a course
 * @access  Protected
 */
router.delete("/:courseId/enroll", jwtAuth, CourseController.unenrollFromCourse);

// ============ STATISTICS ROUTES ============

/**
 * @route   GET /api/courses/stats/creator
 * @desc    Get creator statistics
 * @access  Protected (Creator)
 */
router.get("/stats/creator", jwtAuth, CourseController.getCreatorStats);

export default router;

