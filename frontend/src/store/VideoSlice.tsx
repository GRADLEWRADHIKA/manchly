import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

export interface ActiveUpload {
  uploadId: string;
  videoTitle: string;
  courseId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export const createVideoUpload = createAsyncThunk(
  'videos/createUpload',
  async (
    { courseId, body }: { courseId: string; body: any },
    { rejectWithValue },
  ) => {
    try {
      const res = await instance.post(`courses/${courseId}/videos`, body);
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to create upload';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
      return rejectWithValue(msg);
    }
  },
);

export const checkVideoStatus = createAsyncThunk(
  'videos/checkStatus',
  async (videoId: string) => {
    const res = await instance.get(`courses/videos/${videoId}/status`);
    return res.data?.data;
  },
);

export const updateVideo = createAsyncThunk(
  'videos/update',
  async ({ videoId, body }: { videoId: string; body: any }) => {
    const res = await instance.put(`courses/videos/${videoId}`, body);
    Toast.show({ type: 'success', text1: 'Video updated', position: 'bottom' });
    return res.data?.data;
  },
);

export const deleteVideo = createAsyncThunk(
  'videos/delete',
  async (videoId: string) => {
    const res = await instance.delete(`courses/videos/${videoId}`);
    Toast.show({ type: 'success', text1: 'Video deleted', position: 'bottom' });
    return { id: videoId };
  },
);

const slice = createSlice({
  name: 'videos',
  initialState: {
    byCourse: {} as Record<string, any[]>,
    statusById: {} as Record<string, any>,
    creating: false,
    activeUploads: [] as ActiveUpload[],
  },
  reducers: {
    addActiveUpload(state, action: PayloadAction<Omit<ActiveUpload, 'progress' | 'status'>>) {
      state.activeUploads.push({
        ...action.payload,
        progress: 0,
        status: 'uploading',
      });
    },
    updateUploadProgress(state, action: PayloadAction<{ uploadId: string; progress: number }>) {
      const upload = state.activeUploads.find(u => u.uploadId === action.payload.uploadId);
      if (upload) {
        upload.progress = action.payload.progress;
      }
    },
    completeUpload(state, action: PayloadAction<string>) {
      const upload = state.activeUploads.find(u => u.uploadId === action.payload);
      if (upload) {
        upload.progress = 100;
        upload.status = 'completed';
      }
    },
    failUpload(state, action: PayloadAction<{ uploadId: string; error?: string }>) {
      const upload = state.activeUploads.find(u => u.uploadId === action.payload.uploadId);
      if (upload) {
        upload.status = 'failed';
        upload.error = action.payload.error;
      }
    },
    removeUpload(state, action: PayloadAction<string>) {
      state.activeUploads = state.activeUploads.filter(u => u.uploadId !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createVideoUpload.pending, state => {
        state.creating = true;
      })
      .addCase(createVideoUpload.fulfilled, (state, { payload }) => {
        state.creating = false;
        const courseId = payload?.video?.course_id || payload?.video?.courseId;
        if (!courseId) return;
        const list = state.byCourse[courseId] || [];
        state.byCourse[courseId] = [payload?.video ?? payload, ...list];
      })
      .addCase(createVideoUpload.rejected, state => {
        state.creating = false;
      })
      .addCase(checkVideoStatus.fulfilled, (state, { meta, payload }) => {
        const id = meta.arg;
        state.statusById[id] = payload;
      })
      .addCase(deleteVideo.fulfilled, (state, { payload }) => {
        const id = payload.id;
        Object.keys(state.byCourse).forEach(cid => {
          state.byCourse[cid] = (state.byCourse[cid] || []).filter(
            v => (v.id || v._id) !== id,
          );
        });
        delete state.statusById[id];
      });
  },
});

export const {
  addActiveUpload,
  updateUploadProgress,
  completeUpload,
  failUpload,
  removeUpload,
} = slice.actions;

export default slice.reducer;
