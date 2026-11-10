import Mux from '@mux/mux-node';

// Type definitions based on Mux SDK usage
type Asset = any;
type Upload = any;
type LiveStream = any;
type Space = any;
type Broadcast = any;
type PlaybackID = {
  id: string;
  policy: 'public' | 'signed';
};

interface CreateAssetParams {
  input: string | any[];
  playback_policy?: ('public' | 'signed')[];
  mp4_support?: 'none' | 'standard';
  passthrough?: string;
  test?: boolean;
  encoding_tier?: 'smart' | 'baseline';
  master_access?: 'none' | 'temporary';
  per_title_encode?: boolean;
}

interface CreateUploadParams {
  timeout?: number;
  cors_origin?: string;
  new_asset_settings?: Partial<CreateAssetParams>;
  test?: boolean;
}

interface CreateLiveStreamParams {
  playback_policy?: ('public' | 'signed')[];
  new_asset_settings?: Partial<CreateAssetParams>;
  passthrough?: string;
  reduced_latency?: boolean;
  simulcast_targets?: Array<{
    url: string;
    stream_key?: string;
    passthrough?: string;
  }>;
  test?: boolean;
}

interface UpdateLiveStreamParams {
  passthrough?: string;
  status?: 'active' | 'idle';
  playback_policy?: ('public' | 'signed')[];
  new_asset_settings?: Partial<CreateAssetParams>;
  reduced_latency?: boolean;
}

interface UpdateAssetParams {
  passthrough?: string;
  playback_policy?: ('public' | 'signed')[];
}

interface ListAssetsParams {
  limit?: number;
  page?: number;
}

interface ListUploadsParams {
  limit?: number;
  page?: number;
}

interface ListSpacesParams {
  limit?: number;
  page?: number;
}

interface ListLiveStreamsParams {
  limit?: number;
  page?: number;
}

interface CreateSpaceParams {
  type?: 'server' | 'edge';
  passthrough?: string;
  broadcasts?: Array<{
    passthrough?: string;
    live_stream_id?: string;
    layout?: 'gallery' | 'active-speaker';
    background?: string;
    resolution?: '1920x1080' | '1280x720' | '640x480';
  }>;
}

interface InputSettings {
  url?: string;
  [key: string]: any;
}

// Types for our manager
interface MuxConfig {
  tokenId: string;
  tokenSecret: string;
  webhookSecret?: string;
  timeout?: number;
}

interface CreateAssetOptions {
  input: string | InputSettings[];
  playback_policy?: ('public' | 'signed')[];
  mp4_support?: 'none' | 'standard';
  normalizer?: boolean;
  normalizer_max_resolution?: 'audio_only' | '144p' | '240p' | '360p' | '480p' | '576p' | '720p' | '1080p' | '1440p' | '2160p';
  normalizer_fps?: number;
  normalizer_audio_bitrate?: number;
  test?: boolean;
  passthrough?: string;
  encoding_tier?: 'smart' | 'baseline';
  master_access?: 'none' | 'temporary';
  per_title_encode?: boolean;
}

interface CreateLiveStreamOptions {
  playback_policy?: ('public' | 'signed')[];
  new_asset_settings?: Partial<CreateAssetOptions>;
  passthrough?: string;
  reduced_latency?: boolean;
  simulcast_targets?: Array<{
    url: string;
    stream_key?: string;
    passthrough?: string;
  }>;
  test?: boolean;
}

interface UpdateLiveStreamOptions {
  passthrough?: string;
  status?: 'active' | 'idle';
  playback_policy?: ('public' | 'signed')[];
  new_asset_settings?: Partial<CreateAssetOptions>;
  reduced_latency?: boolean;
}

interface CreateUploadOptions {
  timeout?: number;
  cors_origin?: string;
  new_asset_settings?: Partial<CreateAssetOptions>;
  test?: boolean;
}

interface CreateSpaceOptions {
  type?: 'server' | 'edge';
  passthrough?: string;
  broadcasts?: Array<{
    passthrough?: string;
    live_stream_id?: string;
    layout?: 'gallery' | 'active-speaker';
    background?: string;
    resolution?: '1920x1080' | '1280x720' | '640x480';
  }>;
}

interface PaginationOptions {
  limit?: number;
  page?: number;
}

class MuxManager {
  private mux: Mux;
  private video: Mux['video'];

  constructor(config: MuxConfig) {
    this.mux = new Mux({
      tokenId: config.tokenId,
      tokenSecret: config.tokenSecret,
      timeout: config.timeout || 30000,
    });
    this.video = this.mux.video;
  }

  /**
   * ============ ASSET MANAGEMENT ============
   */

  /**
   * Create a new asset
   */
  async createAsset(options: CreateAssetOptions): Promise<Asset> {
    try {
      // Convert input to inputs array format
      const inputs = Array.isArray(options.input)
        ? options.input
        : typeof options.input === 'string'
        ? [{ url: options.input }]
        : [];

      const createParams: any = {
        inputs: inputs,
        playback_policy: options.playback_policy || ['public'],
        mp4_support: options.mp4_support || 'none',
        passthrough: options.passthrough,
        test: options.test || false,
        encoding_tier: options.encoding_tier,
        master_access: options.master_access,
        per_title_encode: options.per_title_encode,
      };

      const asset = await this.video.assets.create(createParams);
      return asset;
    } catch (error) {
      throw new Error(`Failed to create asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get asset by ID
   */
  async getAsset(assetId: string): Promise<Asset> {
    try {
      const asset = await this.video.assets.retrieve(assetId);
      return asset;
    } catch (error) {
      throw new Error(`Failed to retrieve asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update an asset
   */
  async updateAsset(assetId: string, options: UpdateAssetParams): Promise<Asset> {
    try {
      const asset = await this.video.assets.update(assetId, options);
      return asset;
    } catch (error) {
      throw new Error(`Failed to update asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      await this.video.assets.delete(assetId);
    } catch (error) {
      throw new Error(`Failed to delete asset ${assetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all assets with pagination
   */
  async listAssets(options: PaginationOptions = {}): Promise<Asset[]> {
    try {
      const params: ListAssetsParams = {
        limit: options.limit || 100,
        page: options.page || 1,
      };

      const response = await this.video.assets.list(params);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to list assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get asset playback URL
   */
  getAssetPlaybackUrl(asset: Asset, playbackPolicy: 'public' | 'signed' = 'public'): string | null {
    try {
      const playbackId = asset.playback_ids?.find((p: PlaybackID) => p.policy === playbackPolicy);
      if (!playbackId) return null;

      if (playbackPolicy === 'public') {
        return `https://stream.mux.com/${playbackId.id}.m3u8`;
      } else {
        // For signed URLs, you'll need to generate them with JWT
        return `https://stream.mux.com/${playbackId.id}.m3u8`;
      }
    } catch (error) {
      throw new Error(`Failed to get playback URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get asset thumbnail URL
   */
  getAssetThumbnailUrl(asset: Asset, time: number = 1, width: number = 640): string | null {
    try {
      const playbackId = asset.playback_ids?.find((p: PlaybackID) => p.policy === 'public');
      if (!playbackId) return null;

      return `https://image.mux.com/${playbackId.id}/thumbnail.jpg?time=${time}&width=${width}`;
    } catch (error) {
      throw new Error(`Failed to get thumbnail URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ============ UPLOAD MANAGEMENT ============
   */

  /**
   * Create a direct upload URL
   */
  async createDirectUpload(options: CreateUploadOptions = {}): Promise<Upload> {
    try {
      const uploadParams: any = {
        timeout: options.timeout || 3600,
        new_asset_settings: options.new_asset_settings,
        test: options.test || false,
      };
      
      if (options.cors_origin) {
        uploadParams.cors_origin = options.cors_origin;
      }

      const upload = await this.video.uploads.create(uploadParams);
      return upload;
    } catch (error) {
      throw new Error(`Failed to create direct upload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get upload by ID
   */
  async getUpload(uploadId: string): Promise<Upload> {
    try {
      const upload = await this.video.uploads.retrieve(uploadId);
      return upload;
    } catch (error) {
      throw new Error(`Failed to retrieve upload ${uploadId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel an upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    try {
      await this.video.uploads.cancel(uploadId);
    } catch (error) {
      throw new Error(`Failed to cancel upload ${uploadId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all uploads
   */
  async listUploads(options: PaginationOptions = {}): Promise<Upload[]> {
    try {
      const params: ListUploadsParams = {
        limit: options.limit || 100,
        page: options.page || 1,
      };

      const response = await this.video.uploads.list(params);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to list uploads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ============ LIVE STREAM MANAGEMENT ============
   */

  /**
   * Create a live stream
   */
  async createLiveStream(options: CreateLiveStreamOptions = {}): Promise<LiveStream> {
    try {
      const streamParams: any = {
        playback_policy: options.playback_policy || ['public'],
        passthrough: options.passthrough,
        reduced_latency: options.reduced_latency,
        simulcast_targets: options.simulcast_targets,
        test: options.test || false,
      };
      
      if (options.new_asset_settings) {
        streamParams.new_asset_settings = options.new_asset_settings;
      }

      const liveStream = await this.video.liveStreams.create(streamParams);
      return liveStream;
    } catch (error) {
      throw new Error(`Failed to create live stream: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get live stream by ID
   */
  async getLiveStream(streamId: string): Promise<LiveStream> {
    try {
      const liveStream = await this.video.liveStreams.retrieve(streamId);
      return liveStream;
    } catch (error) {
      throw new Error(`Failed to retrieve live stream ${streamId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a live stream
   */
  async updateLiveStream(streamId: string, options: UpdateLiveStreamOptions): Promise<LiveStream> {
    try {
      const updateParams: UpdateLiveStreamParams = {
        passthrough: options.passthrough,
        status: options.status,
        playback_policy: options.playback_policy,
        new_asset_settings: options.new_asset_settings,
        reduced_latency: options.reduced_latency,
      };

      const liveStream = await this.video.liveStreams.update(streamId, updateParams);
      return liveStream;
    } catch (error) {
      throw new Error(`Failed to update live stream ${streamId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a live stream
   */
  async deleteLiveStream(streamId: string): Promise<void> {
    try {
      await this.video.liveStreams.delete(streamId);
    } catch (error) {
      throw new Error(`Failed to delete live stream ${streamId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all live streams
   */
  async listLiveStreams(options: PaginationOptions = {}): Promise<LiveStream[]> {
    try {
      const params: ListLiveStreamsParams = {
        limit: options.limit || 100,
        page: options.page || 1,
      };

      const response = await this.video.liveStreams.list(params);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to list live streams: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get live stream playback URL
   */
  getLiveStreamPlaybackUrl(liveStream: LiveStream, playbackPolicy: 'public' | 'signed' = 'public'): string | null {
    try {
      const playbackId = liveStream.playback_ids?.find((p: PlaybackID) => p.policy === playbackPolicy);
      if (!playbackId) return null;

      return `https://stream.mux.com/${playbackId.id}.m3u8`;
    } catch (error) {
      throw new Error(`Failed to get live stream playback URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get live stream embed code
   */
  getLiveStreamEmbedCode(liveStream: LiveStream, width: number = 640, height: number = 360): string {
    try {
      const playbackId = liveStream.playback_ids?.[0];
      if (!playbackId) throw new Error('No playback ID found for live stream');

      return `
        <div style="position: relative; padding-bottom: ${(height / width) * 100}%; height: 0; overflow: hidden;">
          <iframe src="https://stream.mux.com/${playbackId.id}.m3u8"
                  style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                  frameborder="0"
                  allow="autoplay; encrypted-media"
                  allowfullscreen>
          </iframe>
        </div>
      `;
    } catch (error) {
      throw new Error(`Failed to generate embed code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ============ SPACE MANAGEMENT ============
   * Note: Spaces API may not be available in all Mux SDK versions
   */

  /**
   * Create a space for real-time video
   */
  async createSpace(options: CreateSpaceOptions = {}): Promise<Space> {
    try {
      // Spaces API might not be available - use type assertion
      const videoAny = this.video as any;
      if (!videoAny.spaces) {
        throw new Error('Spaces API is not available in this Mux SDK version');
      }
      
      const spaceParams: CreateSpaceParams = {
        type: options.type || 'server',
        passthrough: options.passthrough,
        broadcasts: options.broadcasts,
      };

      const space = await videoAny.spaces.create(spaceParams);
      return space;
    } catch (error) {
      throw new Error(`Failed to create space: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get space by ID
   */
  async getSpace(spaceId: string): Promise<Space> {
    try {
      const videoAny = this.video as any;
      if (!videoAny.spaces) {
        throw new Error('Spaces API is not available in this Mux SDK version');
      }
      
      const space = await videoAny.spaces.retrieve(spaceId);
      return space;
    } catch (error) {
      throw new Error(`Failed to retrieve space ${spaceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a space
   */
  async deleteSpace(spaceId: string): Promise<void> {
    try {
      const videoAny = this.video as any;
      if (!videoAny.spaces) {
        throw new Error('Spaces API is not available in this Mux SDK version');
      }
      
      await videoAny.spaces.delete(spaceId);
    } catch (error) {
      throw new Error(`Failed to delete space ${spaceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all spaces
   */
  async listSpaces(options: PaginationOptions = {}): Promise<Space[]> {
    try {
      const videoAny = this.video as any;
      if (!videoAny.spaces) {
        throw new Error('Spaces API is not available in this Mux SDK version');
      }
      
      const params: ListSpacesParams = {
        limit: options.limit || 100,
        page: options.page || 1,
      };

      const response = await videoAny.spaces.list(params);
      return response.data || [];
    } catch (error) {
      throw new Error(`Failed to list spaces: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ============ UTILITY METHODS ============
   */

  /**
   * Wait for asset to become ready
   */
  async waitForAssetReady(assetId: string, timeout: number = 300000, interval: number = 5000): Promise<Asset> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const asset = await this.getAsset(assetId);
      
      if (asset.status === 'ready') {
        return asset;
      }
      
      if (asset.status === 'errored') {
        throw new Error(`Asset processing failed: ${asset.errors?.messages?.join(', ') || 'Unknown error'}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Timeout waiting for asset ${assetId} to become ready`);
  }

  /**
   * Get asset metrics
   */
  async getAssetMetrics(assetId: string): Promise<any> {
    try {
      // Note: You might need to use Mux Data API for detailed metrics
      const asset = await this.getAsset(assetId);
      return {
        duration: asset.duration,
        resolution: asset.max_stored_resolution,
        frame_rate: asset.max_stored_frame_rate,
        size: asset.max_stored_file_size,
        status: asset.status,
      };
    } catch (error) {
      throw new Error(`Failed to get asset metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create signed playback URL
   */
  createSignedPlaybackUrl(playbackId: string, tokenId: string, tokenSecret: string, expiresIn: number = 3600): string {
    // Note: This is a simplified version. You might want to use JWT for proper signing
    return `https://stream.mux.com/${playbackId}.m3u8?token=...`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    try {
      // Try to list assets with limit 1 to test connection
      await this.video.assets.list({ limit: 1 });
      return { ok: true, message: 'Mux API is accessible' };
    } catch (error) {
      return { 
        ok: false, 
        message: `Mux API health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Clean up expired assets (utility method)
   */
  async cleanupExpiredAssets(olderThanDays: number = 30): Promise<{ deleted: number; errors: string[] }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const assets = await this.listAssets({ limit: 1000 });
      const results = { deleted: 0, errors: [] as string[] };

      for (const asset of assets) {
        if (asset.created_at && new Date(asset.created_at) < cutoffDate) {
          try {
            await this.deleteAsset(asset.id);
            results.deleted++;
          } catch (error) {
            results.errors.push(`Failed to delete asset ${asset.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default MuxManager;