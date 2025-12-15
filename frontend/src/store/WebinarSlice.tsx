import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance, setAuthToken } from '../utils/AxiosInstance';

// create webinar api -----------------------
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

// get all webinar -------------------------
export const getAllWebinar = createAsyncThunk(
  'getAllWebinar',
  async (data: object) => {
    try {
      const url = `webinars?page=${data?.page}&limit=${data?.limit}&upcoming=true`;
      const requestBody = data;
      const response = await instance.get(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      console.log('----error----->',response)
      Toast.show({
        type: 'error',
        text1: response?.error?.message,
        position: 'bottom',
      });
      throw error;
    }
  },
);

// delete your course ---------
export const deleteWebinar = createAsyncThunk(
  'deleteWebinar',
  async (id, { rejectWithValue }) => {
    try {
      const res = await instance.delete(`webinars/${id}`);
      Toast.show({
        type: 'success',
        text1: 'Webinar deleted',
        position: 'bottom',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete webinar';
      Toast.show({
        type: 'error',
        text1: msg,
        position: 'bottom',
      });
      return rejectWithValue(msg);
    }
  },
);

// update webinar -------------------
export const updateWebinar = createAsyncThunk(
  'updateWebinar',
  async (
    { webinar_id, body }: { webinar_id: string; body: any },
    { rejectWithValue },
  ) => {
    try {
      const res = await instance.put(`webinars/${webinar_id}`, body);
      Toast.show({
        type: 'success',
        text1: 'Webinar updated',
        position: 'bottom',
      });
      return res.data?.data;
    } catch (e: any) {
      console.log('------error-----', e.request);
      const msg = e?.response?.data?.message || 'Failed to update webinar';
      Toast.show({ type: 'error', text1: msg, position: 'bottom' });
      return rejectWithValue(msg);
    }
  },
);

// create Webinar Enroll  -----------
export const createWebinarEnroll = createAsyncThunk(
  'createWebinarEnroll',
  async (data: object) => {
    try {
      const url = `webinars/${data?.webinar_id}/enroll`;
      // console.log(url)
      // return
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to Enroll',
        position: 'bottom',
      });
      throw error;
    }
  },
);

// webinars payment verify-------------
export const createWebinarVerify = createAsyncThunk(
  'createWebinarVerify',
  async (data: object) => {
    try {
      const url = 'webinars/payment/verify';
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      console.log('---response---', response);
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to buy',
        position: 'bottom',
      });
      throw error;
    }
  },
);

// get Enrolled Webinar -----
export const getEnrolledWebinar = createAsyncThunk(
  'createWebinarVerify',
  async (data: object) => {
    try {
      const url = `webinars/enrolled/me?page=${data?.page}&limit=${data?.limit}&upcoming=${data?.upcoming}`;
      const requestBody = data;
      const response = await instance.get(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      console.log('---response---', response);
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to buy',
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
    //   state.loading = false;
    // })
  },
});

export default WebinarSlice?.reducer;
