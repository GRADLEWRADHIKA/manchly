import Upload from 'react-native-background-upload';
import { Platform } from 'react-native';

class BackgroundUploadService {
  async startUpload(params: {
    fileUri: string;
    uploadUrl: string;
    videoTitle: string;
    onProgress?: (progress: number) => void;
    onComplete?: () => void;
    onError?: (error: string) => void;
  }) {
    const { fileUri, uploadUrl, videoTitle, onProgress, onComplete, onError } = params;

    let filePath = fileUri;
    console.log('[BackgroundUpload] Original fileUri:', fileUri);
    console.log('[BackgroundUpload] Platform:', Platform.OS);

    if (Platform.OS === 'android' && filePath.startsWith('content://')) {
      console.log('[BackgroundUpload] Using content:// URI as-is');
    } else if (filePath.startsWith('file://')) {
      filePath = filePath.replace('file://', '');
      console.log('[BackgroundUpload] Stripped file:// prefix, filePath:', filePath);
    }

    console.log('[BackgroundUpload] Final filePath:', filePath);
    console.log('[BackgroundUpload] uploadUrl:', uploadUrl);

    try {
      console.log('[BackgroundUpload] Calling Upload.startUpload...');
      const uploadId = await Upload.startUpload({
        url: uploadUrl,
        path: filePath,
        method: 'PUT',
        type: 'raw',
        headers: {
          'Content-Type': 'video/mp4',
        },
        notification: {
          enabled: true,
          enableRingTone: false,
          onProgressTitle: 'Uploading Video',
          onProgressMessage: `${videoTitle} — uploading`,
          onCompleteTitle: 'Upload Complete',
          onCompleteMessage: `${videoTitle} uploaded successfully`,
          onErrorTitle: 'Upload Failed',
          onErrorMessage: `${videoTitle} failed to upload`,
          autoClear: true,
        },
      });

      console.log('[BackgroundUpload] Upload started, uploadId:', uploadId);

      Upload.addListener('progress', uploadId, (data) => {
        const progress = Math.round(data.progress);
        console.log(`[BackgroundUpload] Progress: ${progress}%`);
        onProgress?.(progress);
      });

      Upload.addListener('error', uploadId, (data) => {
        console.error('[BackgroundUpload] ERROR event:', JSON.stringify(data));
        const errorMsg = data.error || 'Unknown error';
        onError?.(errorMsg);
      });

      Upload.addListener('completed', uploadId, (data) => {
        console.log('[BackgroundUpload] COMPLETED event:', JSON.stringify(data));
        console.log('[BackgroundUpload] Response code:', data.responseCode);
        console.log('[BackgroundUpload] Response body:', data.responseBody);
        if (data.responseCode >= 200 && data.responseCode < 300) {
          onComplete?.();
        } else {
          const errorMsg = `Server responded with status ${data.responseCode}`;
          onError?.(errorMsg);
        }
      });

      Upload.addListener('cancelled', uploadId, () => {
        console.log('[BackgroundUpload] CANCELLED event');
        onError?.('Upload cancelled');
      });

      return uploadId;
    } catch (error: any) {
      console.error('[BackgroundUpload] CATCH error:', error);
      console.error('[BackgroundUpload] Error message:', error?.message);
      const errorMsg = error?.message || 'Failed to start upload';
      onError?.(errorMsg);
      return null;
    }
  }

  async cancelUpload(uploadId: string) {
    try {
      await Upload.cancelUpload(uploadId);
    } catch (error) {
      console.error('Cancel upload error:', error);
    }
  }
}

export default new BackgroundUploadService();
