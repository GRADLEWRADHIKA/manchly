import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {instance} from '../utils/AxiosInstance';

export type StreakDay = {
  date: string;
  label: string;
  active: boolean;
  isFuture: boolean;
};

export const getMyStreak = createAsyncThunk(
  'activity/getMyStreak',
  async () => {
    try {
      const response = await instance.get('activity/streak/me');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    current_streak: 0,
    week: [] as StreakDay[],
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
        state.week = action.payload?.data?.week || [];
      })
      .addCase(getMyStreak.rejected, state => {
        state.loading = false;
      });
  },
});

export default activitySlice.reducer;