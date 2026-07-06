import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

// get all couses-----
export const fetchCourses = createAsyncThunk(
  'fetchCourses',
  async (data: object) => {
    try {
      const url = 'courses';
      const response = await instance.get(url, { params: data });
      return response;
    } catch (error) {

      throw error;
    }
  },
);

// get public courses -----
export const fetchPublicCourses = createAsyncThunk(
  'fetchPublicCourses',
  async (data: object) => {
    try {
      const url = 'courses/public';
      const response = await instance.get(url, { params: data });
      return response;
    } catch (error) {
      throw error;
    }
  },
);

// get couse by id ---------
export const getCourseById = createAsyncThunk(
  'courses/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await instance.get(`courses/${id}`);
      return res.data?.data;
    } catch (error: any) {
      console.log('getCourseById API error:', error?.response?.status, error?.response?.data || error?.message);
      return rejectWithValue(error?.response?.data || error?.message);
    }
  },
);

// create course -----------
export const createCourse = createAsyncThunk(
  'courses/create',
  async (body: any, { rejectWithValue }) => {
    try {
      const res = await instance.post('courses', body);
      Toast.show({
        type: 'success',
        text1: 'Course created',
        position: 'bottom',
      });
      return res.data?.data;
    } catch (e: any) {

      const msg = e?.response?.data?.message || 'Failed to create course';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
      return rejectWithValue(msg);
    }
  },
);

// uodate your course ---------
export const updateCourse = createAsyncThunk(
  'courses/update',
  async ({ id, body }: { id: string; body: any }, { rejectWithValue }) => {
    try {
      const res = await instance.put(`courses/${id}`, body);
      Toast.show({
        type: 'success',
        text1: 'Course updated',
        position: 'bottom',
      });
      return res.data?.data;
    } catch (e: any) {

      const msg = e?.response?.data?.message || 'Failed to update course';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
      return rejectWithValue(msg);
    }
  },
);

// delete your course ---------
export const deleteCourse = createAsyncThunk(
  'courses/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await instance.delete(`courses/${id}`);
      Toast.show({
        type: 'success',
        text1: 'Course deleted',
        position: 'bottom',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete course';
      Toast.show({
        type: 'error',
        text1: msg,
        position: 'bottom',
      });
      return rejectWithValue(msg);
    }
  },
);

// Get Creator Course Stats
export const getCreatorCourseStats = createAsyncThunk(
  'courses/creatorStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await instance.get('courses/stats/creator');
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch stats');
    }
  },
);

const slice = createSlice({
  name: 'courses',
  initialState: {
    list: [] as any[],
    current: null as any,
    loading: false,
    creatorStats: null as any,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCourses.pending, state => {
        state.loading = true;
      })
      .addCase(fetchCourses.fulfilled, (state, { payload }) => {
        state.loading = false;
        // Handle both direct array and nested object responses
        state.list = payload?.data?.courses ?? payload?.courses ?? payload?.data ?? payload ?? [];
      })
      .addCase(fetchCourses.rejected, state => {
        state.loading = false;
      })
      .addCase(fetchPublicCourses.pending, state => {
        state.loading = true;
      })
      .addCase(fetchPublicCourses.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload?.data?.courses ?? payload?.courses ?? payload?.data ?? payload ?? [];
      })
      .addCase(fetchPublicCourses.rejected, state => {
        state.loading = false;
      })
      .addCase(getCourseById.fulfilled, (state, { payload }) => {
        state.current = payload?.course ?? payload ?? null;
      })
      .addCase(createCourse.fulfilled, (state, { payload }) => {
        // const course = payload?.course || payload;
        // if (course) {
        //   const exists = state.list.some(
        //     c => (c.id || c._id) === (course.id || course._id),
        //   );
        //   if (!exists) {
        //     state.list = [course, ...state.list];
        //   }
        // }
      })
      .addCase(updateCourse.fulfilled, (state, { payload }) => {
        // if (!payload) return;
        // const id = payload.id || payload._id;
        // state.list = state.list.map(c =>
        //   (c.id || c._id) === id ? { ...c, ...payload } : c,
        // );
        // state.current =
        //   state.current && (state.current.id || state.current._id) === id
        //     ? { ...state.current, ...payload }
        //     : state.current;
      })
      .addCase(deleteCourse.fulfilled, (state, { meta }) => {
        // const id = meta.arg;
        // state.list = state.list.filter(c => (c.id || c._id) !== id);
        // if (state.current && (state.current.id || state.current._id) === id)
        //   state.current = null;
      })
      .addCase(getCreatorCourseStats.fulfilled, (state, { payload }) => {
        state.creatorStats = payload ?? null;
      });
  },
});

export default slice.reducer;
