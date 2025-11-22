import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance, setAuthToken } from '../utils/AxiosInstance';

export interface taskState {
  user: any;
  loading: boolean;
  error: string;
}

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

export const WebinarSlice = createSlice({
  name: 'webinar',
  initialState: {},
  reducers: {},
  extraReducers: builder => {
    // builder.addCase(verifyOtp.fulfilled, (state, actions) => {
    //   state.user = actions?.payload?.data?.data?.user;
    //   state.token = actions?.payload?.data?.data?.token;
    //   state.loading = false;
    // })
  },
});

export default WebinarSlice?.reducer;
