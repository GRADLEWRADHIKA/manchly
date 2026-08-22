import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { AIController } from "../controllers/aiController";

const router = Router();

// Public health (lets the frontend know which provider is configured)
router.get("/health", AIController.health);

// All real AI endpoints require auth
router.use(jwtAuth);

// Course
router.post("/course/generate-meta",  AIController.courseGenerateMeta);
router.post("/course/enhance",        AIController.courseEnhance);
router.post("/course/quiz",           AIController.courseQuiz);
router.post("/course/landing-copy",   AIController.courseLandingCopy);
router.post("/course/plan", AIController.coursePlan);

// Webinar
router.post("/webinar/describe",            AIController.webinarDescribe);
router.post("/webinar/enhance",             AIController.webinarEnhance);
router.post("/webinar/email-series",        AIController.webinarEmailSeries);
router.post("/webinar/social-posts",        AIController.webinarSocialPosts);

// Session
router.post("/expert/bio",                  AIController.expertBio);
router.post("/session/enhance",             AIController.sessionEnhance);
router.post("/session/product-suggestions", AIController.sessionProductSuggestions);
router.post("/session/follow-up-message",   AIController.sessionFollowUpMessage);

// Chat + general
router.post("/chat/suggest-reply",   AIController.chatSuggestReply);
router.post("/moderate",             AIController.moderate);
router.post("/lesson/summarize",     AIController.lessonSummarize);

export default router;
