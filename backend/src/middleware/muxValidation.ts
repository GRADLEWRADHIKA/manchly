import { Request, Response, NextFunction } from "express";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";

// Validation middleware for Mux operations
export class MuxValidation {
  
  // Validate asset creation input
  static validateCreateAsset(req: Request, res: Response, next: NextFunction) {
    const { input, playback_policy, mp4_support, encoding_tier, master_access } = req.body;

    // Validate input
    if (!input) {
      return ApiResponseHandler.customError(res, "Input URL or settings are required", 400, "MISSING_INPUT");
    }

    // Validate playback policy
    if (playback_policy) {
      const validPolicies = ['public', 'signed'];
      if (!Array.isArray(playback_policy) || !playback_policy.every(p => validPolicies.includes(p))) {
        return ApiResponseHandler.customError(res, "Invalid playback policy. Must be array of 'public' or 'signed'", 400, "INVALID_PLAYBACK_POLICY");
      }
    }

    // Validate mp4_support
    if (mp4_support && !['none', 'standard'].includes(mp4_support)) {
      return ApiResponseHandler.customError(res, "Invalid mp4_support. Must be 'none' or 'standard'", 400, "INVALID_MP4_SUPPORT");
    }

    // Validate encoding_tier
    if (encoding_tier && !['smart', 'baseline'].includes(encoding_tier)) {
      return ApiResponseHandler.customError(res, "Invalid encoding_tier. Must be 'smart' or 'baseline'", 400, "INVALID_ENCODING_TIER");
    }

    // Validate master_access
    if (master_access && !['none', 'temporary'].includes(master_access)) {
      return ApiResponseHandler.customError(res, "Invalid master_access. Must be 'none' or 'temporary'", 400, "INVALID_MASTER_ACCESS");
    }

    next();
  }

  // Validate live stream creation input
  static validateCreateLiveStream(req: Request, res: Response, next: NextFunction) {
    const { playback_policy, reduced_latency, simulcast_targets } = req.body;

    // Validate playback policy
    if (playback_policy) {
      const validPolicies = ['public', 'signed'];
      if (!Array.isArray(playback_policy) || !playback_policy.every(p => validPolicies.includes(p))) {
        return ApiResponseHandler.customError(res, "Invalid playback policy. Must be array of 'public' or 'signed'", 400, "INVALID_PLAYBACK_POLICY");
      }
    }

    // Validate reduced_latency
    if (reduced_latency !== undefined && typeof reduced_latency !== 'boolean') {
      return ApiResponseHandler.customError(res, "reduced_latency must be a boolean", 400, "INVALID_REDUCED_LATENCY");
    }

    // Validate simulcast_targets
    if (simulcast_targets) {
      if (!Array.isArray(simulcast_targets)) {
        return ApiResponseHandler.customError(res, "simulcast_targets must be an array", 400, "INVALID_SIMULCAST_TARGETS");
      }
      
      for (const target of simulcast_targets) {
        if (!target.url || typeof target.url !== 'string') {
          return ApiResponseHandler.customError(res, "Each simulcast target must have a valid URL", 400, "INVALID_SIMULCAST_URL");
        }
      }
    }

    next();
  }

  // Validate live stream update input
  static validateUpdateLiveStream(req: Request, res: Response, next: NextFunction) {
    const { status, playback_policy } = req.body;

    // Validate status
    if (status && !['active', 'idle'].includes(status)) {
      return ApiResponseHandler.customError(res, "Invalid status. Must be 'active' or 'idle'", 400, "INVALID_STATUS");
    }

    // Validate playback policy
    if (playback_policy) {
      const validPolicies = ['public', 'signed'];
      if (!Array.isArray(playback_policy) || !playback_policy.every(p => validPolicies.includes(p))) {
        return ApiResponseHandler.customError(res, "Invalid playback policy. Must be array of 'public' or 'signed'", 400, "INVALID_PLAYBACK_POLICY");
      }
    }

    next();
  }

  // Validate space creation input
  static validateCreateSpace(req: Request, res: Response, next: NextFunction) {
    const { type, broadcasts } = req.body;

    // Validate type
    if (type && !['server', 'edge'].includes(type)) {
      return ApiResponseHandler.customError(res, "Invalid type. Must be 'server' or 'edge'", 400, "INVALID_SPACE_TYPE");
    }

    // Validate broadcasts
    if (broadcasts) {
      if (!Array.isArray(broadcasts)) {
        return ApiResponseHandler.customError(res, "broadcasts must be an array", 400, "INVALID_BROADCASTS");
      }

      for (const broadcast of broadcasts) {
        if (broadcast.layout && !['gallery', 'active-speaker'].includes(broadcast.layout)) {
          return ApiResponseHandler.customError(res, "Invalid broadcast layout. Must be 'gallery' or 'active-speaker'", 400, "INVALID_BROADCAST_LAYOUT");
        }

        if (broadcast.resolution && !['1920x1080', '1280x720', '640x480'].includes(broadcast.resolution)) {
          return ApiResponseHandler.customError(res, "Invalid broadcast resolution. Must be '1920x1080', '1280x720', or '640x480'", 400, "INVALID_BROADCAST_RESOLUTION");
        }
      }
    }

    next();
  }

  // Validate pagination parameters
  static validatePagination(req: Request, res: Response, next: NextFunction) {
    const { limit, page } = req.query;

    // Validate limit
    if (limit) {
      const limitNum = Number(limit);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
        return ApiResponseHandler.customError(res, "Invalid limit. Must be a number between 1 and 1000", 400, "INVALID_LIMIT");
      }
    }

    // Validate page
    if (page) {
      const pageNum = Number(page);
      if (isNaN(pageNum) || pageNum < 1) {
        return ApiResponseHandler.customError(res, "Invalid page. Must be a number greater than 0", 400, "INVALID_PAGE");
      }
    }

    next();
  }

  // Validate asset ID parameter
  static validateAssetId(req: Request, res: Response, next: NextFunction) {
    const { assetId } = req.params;

    if (!assetId || typeof assetId !== 'string' || assetId.trim() === '') {
      return ApiResponseHandler.customError(res, "Valid asset ID is required", 400, "INVALID_ASSET_ID");
    }

    next();
  }

  // Validate upload ID parameter
  static validateUploadId(req: Request, res: Response, next: NextFunction) {
    const { uploadId } = req.params;

    if (!uploadId || typeof uploadId !== 'string' || uploadId.trim() === '') {
      return ApiResponseHandler.customError(res, "Valid upload ID is required", 400, "INVALID_UPLOAD_ID");
    }

    next();
  }

  // Validate stream ID parameter
  static validateStreamId(req: Request, res: Response, next: NextFunction) {
    const { streamId } = req.params;

    if (!streamId || typeof streamId !== 'string' || streamId.trim() === '') {
      return ApiResponseHandler.customError(res, "Valid stream ID is required", 400, "INVALID_STREAM_ID");
    }

    next();
  }

  // Validate space ID parameter
  static validateSpaceId(req: Request, res: Response, next: NextFunction) {
    const { spaceId } = req.params;

    if (!spaceId || typeof spaceId !== 'string' || spaceId.trim() === '') {
      return ApiResponseHandler.customError(res, "Valid space ID is required", 400, "INVALID_SPACE_ID");
    }

    next();
  }

  // Validate signed URL creation
  static validateSignedUrl(req: Request, res: Response, next: NextFunction) {
    const { playbackId, expiresIn } = req.body;

    if (!playbackId || typeof playbackId !== 'string' || playbackId.trim() === '') {
      return ApiResponseHandler.customError(res, "Valid playback ID is required", 400, "INVALID_PLAYBACK_ID");
    }

    if (expiresIn !== undefined) {
      const expiresInNum = Number(expiresIn);
      if (isNaN(expiresInNum) || expiresInNum < 1 || expiresInNum > 86400) {
        return ApiResponseHandler.customError(res, "Invalid expiresIn. Must be a number between 1 and 86400 seconds", 400, "INVALID_EXPIRES_IN");
      }
    }

    next();
  }

  // Validate cleanup parameters
  static validateCleanup(req: Request, res: Response, next: NextFunction) {
    const { olderThanDays } = req.query;

    if (olderThanDays) {
      const daysNum = Number(olderThanDays);
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
        return ApiResponseHandler.customError(res, "Invalid olderThanDays. Must be a number between 1 and 365", 400, "INVALID_OLDER_THAN_DAYS");
      }
    }

    next();
  }

  // Validate wait ready parameters
  static validateWaitReady(req: Request, res: Response, next: NextFunction) {
    const { timeout, interval } = req.query;

    if (timeout) {
      const timeoutNum = Number(timeout);
      if (isNaN(timeoutNum) || timeoutNum < 1000 || timeoutNum > 1800000) {
        return ApiResponseHandler.customError(res, "Invalid timeout. Must be a number between 1000 and 1800000 milliseconds", 400, "INVALID_TIMEOUT");
      }
    }

    if (interval) {
      const intervalNum = Number(interval);
      if (isNaN(intervalNum) || intervalNum < 1000 || intervalNum > 60000) {
        return ApiResponseHandler.customError(res, "Invalid interval. Must be a number between 1000 and 60000 milliseconds", 400, "INVALID_INTERVAL");
      }
    }

    next();
  }
}
