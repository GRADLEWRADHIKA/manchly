import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware";
import validateCreatorProfile from "../middleware/validateCreatorProfile";
import {
  getMyProfile,
  createProfile,
  updateProfile,
  togglePublish,
  webhookTest,
  getPublicProfile,
} from "../controllers/creatorProfileController";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
// Registered before the auth guard below, because router.use() applies to every
// request that enters this router — not just the routes declared after it — so
// anything placed under it is authenticated no matter what the path says.

// GET /api/creator/:userId/public — public creator profile (no auth required)
router.get("/:userId/public", getPublicProfile);

// ── Authenticated ─────────────────────────────────────────────────────────────
// Everything below requires a valid Supabase JWT.
router.use(authMiddleware);

// POST   /api/creator/profile          — create a new creator profile
router.post("/profile", createProfile);

// GET    /api/creator/profile          — fetch the authenticated user's profile
router.get("/profile", getMyProfile);

// PUT    /api/creator/profile          — update (upsert) the creator profile
router.put("/profile", validateCreatorProfile, updateProfile);

// POST   /api/creator/profile/publish  — toggle isPublished flag
router.post("/profile/publish", togglePublish);

// POST   /api/creator/webhook-test     — simulate a Meta webhook automation
router.post("/webhook-test", webhookTest);

export default router;
