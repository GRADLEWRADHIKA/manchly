import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';
import { getApiErrorMessage } from '../utils/apiError';

// Get creator's extended profile (bio, city, niche, experience, etc.)
export const getCreatorProfile = createAsyncThunk(
  'creatorProfile/getMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await instance.get('creator/profile');
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(getApiErrorMessage(error, 'Failed to load profile'));
    }
  },
);

// Create or update creator's extended profile
export const updateCreatorProfile = createAsyncThunk(
  'creatorProfile/updateProfile',
  async (data: object, { rejectWithValue }) => {
    try {
      const res = await instance.put('creator/profile', data);
      return res.data?.data;
    } catch (error: any) {
      const msg = getApiErrorMessage(error, 'Failed to update profile');
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

const slice = createSlice({
  name: 'creatorProfile',
  initialState: {
    profile: null as any,
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getCreatorProfile.pending, state => {
        state.loading = true;
      })
      .addCase(getCreatorProfile.fulfilled, (state, { payload }) => {
        state.profile = payload;
        state.loading = false;
      })
      .addCase(getCreatorProfile.rejected, state => {
        state.loading = false;
      })
      .addCase(updateCreatorProfile.fulfilled, (state, { payload }) => {
        state.profile = payload;
      });
  },
});

export default slice.reducer;