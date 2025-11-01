import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

type ListQuery = {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  status?: string;
  search?: string;
};

export const fetchCourses = createAsyncThunk('courses/fetchAll', async (q: ListQuery = {}) => {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) params.append(k, String(v));
  });
  const url = params.toString() ? `courses?${params.toString()}` : 'courses';
  const res = await instance.get(url);
  return res.data?.data;
});

export const getCourseById = createAsyncThunk('courses/getById', async (id: string) => {
  const res = await instance.get(`courses/${id}`);
  return res.data?.data;
});

export const createCourse = createAsyncThunk('courses/create', async (body: any, { rejectWithValue }) => {
  try {
    const res = await instance.post('courses', body);
    Toast.show({ type: 'success', text1: 'Course created', position: 'bottom' });
    return res.data?.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Failed to create course';
    Toast.show({ type: 'error', text1: msg, position: 'bottom' });
    return rejectWithValue(msg);
  }
});

export const updateCourse = createAsyncThunk('courses/update', async ({ id, body }: { id: string; body: any }, { rejectWithValue }) => {
  try {
    const res = await instance.put(`courses/${id}`, body);
    Toast.show({ type: 'success', text1: 'Course updated', position: 'bottom' });
    return res.data?.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Failed to update course';
    Toast.show({ type: 'error', text1: msg, position: 'bottom' });
    return rejectWithValue(msg);
  }
});

export const deleteCourse = createAsyncThunk('courses/delete', async (id: string, { rejectWithValue }) => {
  try {
    const res = await instance.delete(`courses/${id}`);
    Toast.show({ type: 'success', text1: 'Course deleted', position: 'bottom' });
    return res.data?.data;
  } catch (e: any) {
    const msg = e?.response?.data?.message || 'Failed to delete course';
    Toast.show({ type: 'error', text1: msg, position: 'bottom' });
    return rejectWithValue(msg);
  }
});

const slice = createSlice({
  name: 'courses',
  initialState: {
    list: [] as any[],
    current: null as any,
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchCourses.pending, state => { state.loading = true; })
      .addCase(fetchCourses.fulfilled, (state, { payload }) => { state.loading = false; state.list = payload?.courses ?? payload ?? []; })
      .addCase(fetchCourses.rejected, state => { state.loading = false; })
      .addCase(getCourseById.fulfilled, (state, { payload }) => { state.current = payload?.course ?? payload ?? null; })
      .addCase(createCourse.fulfilled, (state, { payload }) => { 
        const course = payload?.course || payload;
        if (course) {
          const exists = state.list.some(c => (c.id || c._id) === (course.id || course._id));
          if (!exists) {
            state.list = [course, ...state.list];
          }
        }
      })
      .addCase(updateCourse.fulfilled, (state, { payload }) => {
        if (!payload) return; const id = payload.id || payload._id;
        state.list = state.list.map(c => ((c.id || c._id) === id ? { ...c, ...payload } : c));
        state.current = state.current && ((state.current.id || state.current._id) === id) ? { ...state.current, ...payload } : state.current;
      })
      .addCase(deleteCourse.fulfilled, (state, { meta }) => {
        const id = meta.arg; state.list = state.list.filter(c => (c.id || c._id) !== id);
        if (state.current && (state.current.id || state.current._id) === id) state.current = null;
      });
  },
});

export default slice.reducer;

