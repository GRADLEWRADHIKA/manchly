import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance, setAuthToken } from '../utils/AxiosInstance';

export const createWebinar = createAsyncThunk(
  'createWebinar',
  async (data: object) => {
    try {
      const url = 'webinars';
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      console.log('---response---', response);
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to create webinar',
        position: 'bottom',
      });
      throw error;
    }
  },
);

// /webinars?page=1&limit=10&upcoming=true

export const WebinarSlice = createSlice({
  name: 'webinar',
  initialState: {},
  reducers: {},
  extraReducers: builder => {
    // builder.addCase(verifyOtp.fulfilled, (state, actions) => {
    //   state.user = actions?.payload?.data?.data?.user;
    //   state.loading = false;
    // })
  },
});

export default WebinarSlice?.reducer;
