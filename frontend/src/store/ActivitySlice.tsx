import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { instance } from '../utils/AxiosInstance';

export const getMyStreak = createAsyncThunk(
  'activity/getMyStreak',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await instance.get('activity/streak/me');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error?.message);
    }
  },
);

const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    current_streak: 0,
    week: [] as { date: string; label: string; active: boolean; isFuture: boolean }[],
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getMyStreak.pending, state => {
        state.loading = true;
      })
      .addCase(getMyStreak.fulfilled, (state, action) => {
        state.loading = false;
        state.current_streak = action.payload?.data?.current_streak ?? 0;
        state.week = action.payload?.data?.week ?? [];
      })
      .addCase(getMyStreak.rejected, state => {
        state.loading = false;
      });
  },
});

export default activitySlice.reducer;