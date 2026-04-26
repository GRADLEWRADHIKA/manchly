import { Router } from "express";
import { ClickancyController } from "../controllers/clickancyController";

const router = Router();

// Public — no auth needed; powers the Clickancy landing page catalog.
router.get("/courses", ClickancyController.getCourses);

export default router;
