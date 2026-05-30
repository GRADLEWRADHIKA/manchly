import { Router } from "express";
import { jwtAuth } from "../middleware/jwtAuth";
import { AIController } from "../controllers/aiController";

const router = Router();

// Public health (lets the frontend know which provider is configured)
router.get("/health", AIController.health);

// All real AI endpoints require auth
router.use(jwtAuth);

router.post("/course/generate-meta", AIController.courseGenerateMeta);
router.post("/webinar/describe",     AIController.webinarDescribe);
router.post("/expert/bio",           AIController.expertBio);
router.post("/chat/suggest-reply",   AIController.chatSuggestReply);
router.post("/moderate",             AIController.moderate);
router.post("/lesson/summarize",     AIController.lessonSummarize);

export default router;
