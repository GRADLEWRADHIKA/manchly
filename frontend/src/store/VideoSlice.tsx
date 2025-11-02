import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

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
  },
  reducers: {},
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

export default slice.reducer;
