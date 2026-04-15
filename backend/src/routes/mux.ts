import { Router } from "express";
import {
  MuxController,
  disableRequestTimeout,
  handleNormalizeMulter,
} from "../controllers/muxController";
import { jwtAuth } from "../middleware/jwtAuth";
import { MuxValidation } from "../middleware/muxValidation";

const router = Router();

// Apply JWT authentication to all Mux routes
router.use(jwtAuth);

// ============ NORMALIZED UPLOAD ROUTES ============
// These must be declared BEFORE the generic /uploads/:uploadId routes so the
// "normalize" path segment isn't swallowed by the :uploadId param.

// Accept a raw video, re-encode to 720p via ffmpeg, push to Mux. Returns 202.
router.post(
  "/normalize",
  disableRequestTimeout,
  handleNormalizeMulter,
  MuxController.uploadAndNormalize
);

// Poll the status of a normalize job
router.get("/normalize/:jobId", MuxController.getNormalizeJob);

// ============ ASSET ROUTES ============

// Create a new asset
router.post("/assets", MuxValidation.validateCreateAsset, MuxController.createAsset);

// Get asset by ID
router.get("/assets/:assetId", MuxValidation.validateAssetId, MuxController.getAsset);

// Update an asset
router.put("/assets/:assetId", MuxValidation.validateAssetId, MuxController.updateAsset);

// Delete an asset
router.delete("/assets/:assetId", MuxValidation.validateAssetId, MuxController.deleteAsset);

// List all assets with pagination
router.get("/assets", MuxValidation.validatePagination, MuxController.listAssets);

// Get asset metrics
router.get("/assets/:assetId/metrics", MuxValidation.validateAssetId, MuxController.getAssetMetrics);

// Wait for asset to become ready
router.post("/assets/:assetId/wait-ready", MuxValidation.validateAssetId, MuxValidation.validateWaitReady, MuxController.waitForAssetReady);

// ============ UPLOAD ROUTES ============

// Create a direct upload URL
router.post("/uploads", MuxController.createDirectUpload);

// Get upload by ID
router.get("/uploads/:uploadId", MuxValidation.validateUploadId, MuxController.getUpload);

// Cancel an upload
router.delete("/uploads/:uploadId", MuxValidation.validateUploadId, MuxController.cancelUpload);

// List all uploads
router.get("/uploads", MuxValidation.validatePagination, MuxController.listUploads);

// ============ LIVE STREAM ROUTES ============

// Create a live stream
router.post("/live-streams", MuxValidation.validateCreateLiveStream, MuxController.createLiveStream);

// Get live stream by ID
router.get("/live-streams/:streamId", MuxValidation.validateStreamId, MuxController.getLiveStream);

// Update a live stream
router.put("/live-streams/:streamId", MuxValidation.validateStreamId, MuxValidation.validateUpdateLiveStream, MuxController.updateLiveStream);

// Delete a live stream
router.delete("/live-streams/:streamId", MuxValidation.validateStreamId, MuxController.deleteLiveStream);

// List all live streams
router.get("/live-streams", MuxValidation.validatePagination, MuxController.listLiveStreams);

// ============ SPACE ROUTES ============

// Create a space for real-time video
router.post("/spaces", MuxValidation.validateCreateSpace, MuxController.createSpace);

// Get space by ID
router.get("/spaces/:spaceId", MuxValidation.validateSpaceId, MuxController.getSpace);

// Delete a space
router.delete("/spaces/:spaceId", MuxValidation.validateSpaceId, MuxController.deleteSpace);

// List all spaces
router.get("/spaces", MuxValidation.validatePagination, MuxController.listSpaces);

// ============ UTILITY ROUTES ============

// Health check for Mux API
router.get("/health", MuxController.healthCheck);

// Clean up expired assets
router.post("/cleanup", MuxValidation.validateCleanup, MuxController.cleanupExpiredAssets);

// Generate signed playback URL
router.post("/signed-url", MuxValidation.validateSignedUrl, MuxController.createSignedPlaybackUrl);

export default router;
