import { Router } from "express";
import { CreatorTrialController } from "../controllers/creatorTrialController";
import { jwtAuth } from "../middleware/jwtAuth";

const router = Router();

router.use(jwtAuth);

router.get("/status", CreatorTrialController.getStatus);
router.post("/subscribe", CreatorTrialController.subscribe);
router.post("/verify", CreatorTrialController.verify);
router.post("/cancel", CreatorTrialController.cancel);

export default router;
