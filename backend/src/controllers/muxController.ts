import { Request, Response } from "express";
import MuxManager from "../utils/MuxManager";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import dotenv from "dotenv";

dotenv.config();

// Initialize Mux Manager
const muxManager = new MuxManager({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
  webhookSecret: process.env.MUX_WEBHOOK_SECRET,
  timeout: 30000
});

export class MuxController {
  // ============ ASSET MANAGEMENT ============

  /**
   * Create a new asset
   */
  static async createAsset(req: Request, res: Response) {
    const { 
      input, 
      playback_policy = ['public'], 
      mp4_support = 'none',
      passthrough,
      test = false,
      encoding_tier,
      master_access,
      per_title_encode
    } = req.body;

    if (!input) {
      return ApiResponseHandler.customError(res, "Input URL or settings are required", 400, "MISSING_INPUT");
    }

    try {
      const asset = await muxManager.createAsset({
        input,
        playback_policy,
        mp4_support,
        passthrough,
        test,
        encoding_tier,
        master_access,
        per_title_encode
      });

      ApiResponseHandler.success(res, { asset }, "Asset created successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get asset by ID
   */
  static async getAsset(req: Request, res: Response) {
    const { assetId } = req.params;

    if (!assetId) {
      return ApiResponseHandler.customError(res, "Asset ID is required", 400, "MISSING_ASSET_ID");
    }

    try {
      const asset = await muxManager.getAsset(assetId);
      
      // Add playback URLs for convenience
      const playbackUrl = muxManager.getAssetPlaybackUrl(asset);
      const thumbnailUrl = muxManager.getAssetThumbnailUrl(asset);

      ApiResponseHandler.success(res, { 
        asset,
        playback_url: playbackUrl,
        thumbnail_url: thumbnailUrl
      }, "Asset retrieved successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Asset not found", 404, "ASSET_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Update an asset
   */
  static async updateAsset(req: Request, res: Response) {
    const { assetId } = req.params;
    const { passthrough, playback_policy } = req.body;

    if (!assetId) {
      return ApiResponseHandler.customError(res, "Asset ID is required", 400, "MISSING_ASSET_ID");
    }

    try {
      const asset = await muxManager.updateAsset(assetId, {
        passthrough,
        playback_policy
      });

      ApiResponseHandler.success(res, { asset }, "Asset updated successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Asset not found", 404, "ASSET_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Delete an asset
   */
  static async deleteAsset(req: Request, res: Response) {
    const { assetId } = req.params;

    if (!assetId) {
      return ApiResponseHandler.customError(res, "Asset ID is required", 400, "MISSING_ASSET_ID");
    }

    try {
      await muxManager.deleteAsset(assetId);
      ApiResponseHandler.success(res, {}, "Asset deleted successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Asset not found", 404, "ASSET_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * List all assets with pagination
   */
  static async listAssets(req: Request, res: Response) {
    const { limit = 100, page = 1 } = req.query;

    try {
      const assets = await muxManager.listAssets({
        limit: Number(limit),
        page: Number(page)
      });

      // Add playback URLs for each asset
      const assetsWithUrls = assets.map(asset => ({
        ...asset,
        playback_url: muxManager.getAssetPlaybackUrl(asset),
        thumbnail_url: muxManager.getAssetThumbnailUrl(asset)
      }));

      ApiResponseHandler.success(res, { 
        assets: assetsWithUrls,
        pagination: {
          limit: Number(limit),
          page: Number(page),
          total: assets.length
        }
      }, "Assets retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get asset metrics
   */
  static async getAssetMetrics(req: Request, res: Response) {
    const { assetId } = req.params;

    if (!assetId) {
      return ApiResponseHandler.customError(res, "Asset ID is required", 400, "MISSING_ASSET_ID");
    }

    try {
      const metrics = await muxManager.getAssetMetrics(assetId);
      ApiResponseHandler.success(res, { metrics }, "Asset metrics retrieved successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Asset not found", 404, "ASSET_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Wait for asset to become ready
   */
  static async waitForAssetReady(req: Request, res: Response) {
    const { assetId } = req.params;
    const { timeout = 300000, interval = 5000 } = req.query;

    if (!assetId) {
      return ApiResponseHandler.customError(res, "Asset ID is required", 400, "MISSING_ASSET_ID");
    }

    try {
      const asset = await muxManager.waitForAssetReady(
        assetId, 
        Number(timeout), 
        Number(interval)
      );

      ApiResponseHandler.success(res, { asset }, "Asset is ready");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Asset not found", 404, "ASSET_NOT_FOUND");
      }
      if (err.message.includes('Timeout')) {
        return ApiResponseHandler.customError(res, "Asset processing timeout", 408, "ASSET_TIMEOUT");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ UPLOAD MANAGEMENT ============

  /**
   * Create a direct upload URL
   */
  static async createDirectUpload(req: Request, res: Response) {
    const { 
      timeout = 3600, 
      cors_origin, 
      new_asset_settings, 
      test = false 
    } = req.body;

    try {
      const upload = await muxManager.createDirectUpload({
        timeout,
        cors_origin,
        new_asset_settings,
        test
      });

      ApiResponseHandler.success(res, { upload }, "Direct upload URL created successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get upload by ID
   */
  static async getUpload(req: Request, res: Response) {
    const { uploadId } = req.params;

    if (!uploadId) {
      return ApiResponseHandler.customError(res, "Upload ID is required", 400, "MISSING_UPLOAD_ID");
    }

    try {
      const upload = await muxManager.getUpload(uploadId);
      ApiResponseHandler.success(res, { upload }, "Upload retrieved successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Upload not found", 404, "UPLOAD_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Cancel an upload
   */
  static async cancelUpload(req: Request, res: Response) {
    const { uploadId } = req.params;

    if (!uploadId) {
      return ApiResponseHandler.customError(res, "Upload ID is required", 400, "MISSING_UPLOAD_ID");
    }

    try {
      await muxManager.cancelUpload(uploadId);
      ApiResponseHandler.success(res, {}, "Upload cancelled successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Upload not found", 404, "UPLOAD_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * List all uploads
   */
  static async listUploads(req: Request, res: Response) {
    const { limit = 100, page = 1 } = req.query;

    try {
      const uploads = await muxManager.listUploads({
        limit: Number(limit),
        page: Number(page)
      });

      ApiResponseHandler.success(res, { 
        uploads,
        pagination: {
          limit: Number(limit),
          page: Number(page),
          total: uploads.length
        }
      }, "Uploads retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ LIVE STREAM MANAGEMENT ============

  /**
   * Create a live stream
   */
  static async createLiveStream(req: Request, res: Response) {
    const { 
      playback_policy = ['public'], 
      new_asset_settings, 
      passthrough, 
      reduced_latency,
      simulcast_targets,
      test = false 
    } = req.body;

    try {
      const liveStream = await muxManager.createLiveStream({
        playback_policy,
        new_asset_settings,
        passthrough,
        reduced_latency,
        simulcast_targets,
        test
      });

      // Add playback URL and embed code
      const playbackUrl = muxManager.getLiveStreamPlaybackUrl(liveStream);
      const embedCode = muxManager.getLiveStreamEmbedCode(liveStream);

      ApiResponseHandler.success(res, { 
        live_stream: liveStream,
        playback_url: playbackUrl,
        embed_code: embedCode
      }, "Live stream created successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get live stream by ID
   */
  static async getLiveStream(req: Request, res: Response) {
    const { streamId } = req.params;

    if (!streamId) {
      return ApiResponseHandler.customError(res, "Stream ID is required", 400, "MISSING_STREAM_ID");
    }

    try {
      const liveStream = await muxManager.getLiveStream(streamId);
      
      // Add playback URL and embed code
      const playbackUrl = muxManager.getLiveStreamPlaybackUrl(liveStream);
      const embedCode = muxManager.getLiveStreamEmbedCode(liveStream);

      ApiResponseHandler.success(res, { 
        live_stream: liveStream,
        playback_url: playbackUrl,
        embed_code: embedCode
      }, "Live stream retrieved successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Live stream not found", 404, "LIVE_STREAM_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Update a live stream
   */
  static async updateLiveStream(req: Request, res: Response) {
    const { streamId } = req.params;
    const { 
      passthrough, 
      status, 
      playback_policy, 
      new_asset_settings, 
      reduced_latency 
    } = req.body;

    if (!streamId) {
      return ApiResponseHandler.customError(res, "Stream ID is required", 400, "MISSING_STREAM_ID");
    }

    try {
      const liveStream = await muxManager.updateLiveStream(streamId, {
        passthrough,
        status,
        playback_policy,
        new_asset_settings,
        reduced_latency
      });

      ApiResponseHandler.success(res, { live_stream: liveStream }, "Live stream updated successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Live stream not found", 404, "LIVE_STREAM_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Delete a live stream
   */
  static async deleteLiveStream(req: Request, res: Response) {
    const { streamId } = req.params;

    if (!streamId) {
      return ApiResponseHandler.customError(res, "Stream ID is required", 400, "MISSING_STREAM_ID");
    }

    try {
      await muxManager.deleteLiveStream(streamId);
      ApiResponseHandler.success(res, {}, "Live stream deleted successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Live stream not found", 404, "LIVE_STREAM_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * List all live streams
   */
  static async listLiveStreams(req: Request, res: Response) {
    const { limit = 100, page = 1 } = req.query;

    try {
      const liveStreams = await muxManager.listLiveStreams({
        limit: Number(limit),
        page: Number(page)
      });

      // Add playback URLs for each live stream
      const liveStreamsWithUrls = liveStreams.map(stream => ({
        ...stream,
        playback_url: muxManager.getLiveStreamPlaybackUrl(stream),
        embed_code: muxManager.getLiveStreamEmbedCode(stream)
      }));

      ApiResponseHandler.success(res, { 
        live_streams: liveStreamsWithUrls,
        pagination: {
          limit: Number(limit),
          page: Number(page),
          total: liveStreams.length
        }
      }, "Live streams retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ SPACE MANAGEMENT ============

  /**
   * Create a space for real-time video
   */
  static async createSpace(req: Request, res: Response) {
    const { 
      type = 'server', 
      passthrough, 
      broadcasts 
    } = req.body;

    try {
      const space = await muxManager.createSpace({
        type,
        passthrough,
        broadcasts
      });

      ApiResponseHandler.success(res, { space }, "Space created successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get space by ID
   */
  static async getSpace(req: Request, res: Response) {
    const { spaceId } = req.params;

    if (!spaceId) {
      return ApiResponseHandler.customError(res, "Space ID is required", 400, "MISSING_SPACE_ID");
    }

    try {
      const space = await muxManager.getSpace(spaceId);
      ApiResponseHandler.success(res, { space }, "Space retrieved successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Space not found", 404, "SPACE_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Delete a space
   */
  static async deleteSpace(req: Request, res: Response) {
    const { spaceId } = req.params;

    if (!spaceId) {
      return ApiResponseHandler.customError(res, "Space ID is required", 400, "MISSING_SPACE_ID");
    }

    try {
      await muxManager.deleteSpace(spaceId);
      ApiResponseHandler.success(res, {}, "Space deleted successfully");
    } catch (err: any) {
      if (err.message.includes('not found')) {
        return ApiResponseHandler.customError(res, "Space not found", 404, "SPACE_NOT_FOUND");
      }
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * List all spaces
   */
  static async listSpaces(req: Request, res: Response) {
    const { limit = 100, page = 1 } = req.query;

    try {
      const spaces = await muxManager.listSpaces({
        limit: Number(limit),
        page: Number(page)
      });

      ApiResponseHandler.success(res, { 
        spaces,
        pagination: {
          limit: Number(limit),
          page: Number(page),
          total: spaces.length
        }
      }, "Spaces retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ UTILITY ENDPOINTS ============

  /**
   * Health check for Mux API
   */
  static async healthCheck(req: Request, res: Response) {
    try {
      const health = await muxManager.healthCheck();
      
      if (health.ok) {
        ApiResponseHandler.success(res, { health }, "Mux API is healthy");
      } else {
        ApiResponseHandler.customError(res, health.message, 503, "MUX_API_UNHEALTHY");
      }
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Clean up expired assets
   */
  static async cleanupExpiredAssets(req: Request, res: Response) {
    const { olderThanDays = 30 } = req.query;

    try {
      const results = await muxManager.cleanupExpiredAssets(Number(olderThanDays));
      
      ApiResponseHandler.success(res, { 
        cleanup_results: results,
        older_than_days: Number(olderThanDays)
      }, "Asset cleanup completed");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Generate signed playback URL
   */
  static async createSignedPlaybackUrl(req: Request, res: Response) {
    const { playbackId, expiresIn = 3600 } = req.body;

    if (!playbackId) {
      return ApiResponseHandler.customError(res, "Playback ID is required", 400, "MISSING_PLAYBACK_ID");
    }

    try {
      const signedUrl = muxManager.createSignedPlaybackUrl(
        playbackId,
        process.env.MUX_TOKEN_ID!,
        process.env.MUX_TOKEN_SECRET!,
        Number(expiresIn)
      );

      ApiResponseHandler.success(res, { 
        signed_url: signedUrl,
        expires_in: Number(expiresIn)
      }, "Signed playback URL created successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
