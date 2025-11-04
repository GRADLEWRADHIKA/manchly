import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

export const enrollInCourse = createAsyncThunk(
  'enroll/enroll',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const res = await instance.post(`courses/${courseId}/enroll`);
      Toast.show({
        type: 'success',
        text1: 'Enrolled successfully',
        position: 'bottom',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to enroll';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
      return rejectWithValue(msg);
    }
  },
);

export const getEnrolledCourses = createAsyncThunk(
  'enroll/list',
  async (q: { page?: number; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (q.page) params.append('page', String(q.page));
    if (q.limit) params.append('limit', String(q.limit));
    const url = params.toString()
      ? `courses/enrolled/me?${params.toString()}`
      : 'courses/enrolled/me';
    const res = await instance.get(url);
    return res.data?.data;
  },
);

export const updateCourseProgress = createAsyncThunk(
  'enroll/progress',
  async ({ courseId, progress }: { courseId: string; progress: number }) => {
    const res = await instance.put(`courses/${courseId}/progress`, {
      progress,
    });
    return res.data?.data;
  },
);

export const unenrollFromCourse = createAsyncThunk(
  'enroll/unenroll',
  async (courseId: string) => {
    const res = await instance.delete(`courses/${courseId}/enroll`);
    Toast.show({ type: 'success', text1: 'Unenrolled', position: 'bottom' });
    return { courseId };
  },
);

const slice = createSlice({
  name: 'enrollments',
  initialState: { list: [] as any[], loading: false },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getEnrolledCourses.pending, state => {
        state.loading = true;
      })
      .addCase(getEnrolledCourses.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload?.courses ?? payload ?? [];
      })
      .addCase(getEnrolledCourses.rejected, state => {
        state.loading = false;
      })
      .addCase(unenrollFromCourse.fulfilled, (state, { payload }) => {
        state.list = state.list.filter(
          c => (c.id || c._id) !== payload.courseId,
        );
      });
  },
});

export default slice.reducer;
