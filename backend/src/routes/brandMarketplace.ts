import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import {
  listCreators,
  getCreatorById,
  trackProfileView,
  getCreatorContact,
} from "../controllers/brandMarketplaceController";

const router = Router();

// All marketplace routes require a valid Supabase JWT
router.use(authMiddleware);

// GET    /api/marketplace/creators                          — list published creators
router.get("/creators", listCreators);

// GET    /api/marketplace/creators/:profileId               — get single creator profile
router.get("/creators/:profileId", getCreatorById);

// POST   /api/marketplace/creators/:profileId/view          — record a profile view
router.post("/creators/:profileId/view", trackProfileView);

// GET    /api/marketplace/creators/:profileId/contact       — premium-gated contact info
router.get("/creators/:profileId/contact", getCreatorContact);

export default router;
