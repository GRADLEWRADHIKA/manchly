import { Router } from "express";
import { ReelController } from "../controllers/reelController";
import { jwtAuth } from "../middleware/jwtAuth";
import { optionalJwtAuth } from "../middleware/optionalJwtAuth";

const router = Router();

/**
 * The feed is readable without logging in so reels can be shared and indexed.
 * optionalJwtAuth attaches req.user when a token is present, which is what
 * lets the feed mark courses the viewer already owns.
 */

/** @route GET /reels — scrollable feed of promo reels */
router.get("/", optionalJwtAuth, ReelController.getFeed);

/** @route POST /reels/:reelId/view — bump the view counter */
router.post("/:reelId/view", optionalJwtAuth, ReelController.trackView);

// ── Creator-owned routes ──────────────────────────────────────────────────────

/** @route GET /reels/mine — reels belonging to the signed-in creator */
router.get("/mine", jwtAuth, ReelController.getMyReels);

/** @route POST /reels/course/:courseId — start a reel upload for a course */
router.post("/course/:courseId", jwtAuth, ReelController.createReelUpload);

/** @route GET /reels/:reelId/status — poll Mux until the reel is READY */
router.get("/:reelId/status", jwtAuth, ReelController.getReelStatus);

/** @route PATCH /reels/:reelId — edit caption, or hide/show */
router.patch("/:reelId", jwtAuth, ReelController.updateReel);

/** @route DELETE /reels/:reelId — remove the reel and its Mux asset */
router.delete("/:reelId", jwtAuth, ReelController.deleteReel);

export default router;
