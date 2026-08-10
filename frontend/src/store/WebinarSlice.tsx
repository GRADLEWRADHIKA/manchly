import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

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
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to create webinar',
        position: 'top',
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
      const url = 'webinars';
      const response = await instance.get(url, { params: data });
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');

      Toast.show({
        type: 'error',
        text1: response?.error?.message,
        position: 'top',
      });
      throw error;
    }
  },
);

export const getWebinarById = createAsyncThunk(
  'getWebinarById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await instance.get(`webinars/${id}`);
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to fetch webinar';
      return rejectWithValue(msg);
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
        position: 'top',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete webinar';
      Toast.show({
        type: 'error',
        text1: msg,
        position: 'top',
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
        position: 'top',
      });
      return res.data?.data;
    } catch (e: any) {

      const msg = e?.response?.data?.message || 'Failed to update webinar';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
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

      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to Enroll',
        position: 'top',
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
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to buy',
        position: 'top',
      });
      throw error;
    }
  },
);

// get Enrolled Webinar -----
export const getEnrolledWebinar = createAsyncThunk(
  'getEnrolledWebinar',
  async (data: object) => {
    try {
      const url = `webinars/enrolled/me?page=${data?.page}&limit=${data?.limit}&upcoming=${data?.upcoming}`;
      const requestBody = data;
      const response = await instance.get(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      Toast.show({
        type: 'error',
        text1: response?.error?.message || 'Failed to buy',
        position: 'top',
      });
      throw error;
    }
  },
);

// Submit / update a webinar review ---------
export const reviewWebinar = createAsyncThunk(
  'webinar/review',
  async (
    { webinarId, rating, comment }: { webinarId: string; rating: number; comment?: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await instance.post(`webinars/${webinarId}/review`, { rating, comment });
      Toast.show({ type: 'success', text1: 'Thanks for your feedback!', position: 'top' });
      return res.data?.data;
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.response?.data?.error || 'Failed to submit review';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

// List reviews for a webinar ---------
export const getWebinarReviews = createAsyncThunk(
  'webinar/getReviews',
  async (webinarId: string, { rejectWithValue }) => {
    try {
      const res = await instance.get(`webinars/${webinarId}/reviews`);
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch reviews');
    }
  },
);

// Publish a webinar recording as a course + auto-enroll registrants ---------
export const publishWebinarRecording = createAsyncThunk(
  'webinar/publishRecording',
  async (
    {
      webinarId,
      recording_url,
      title,
      price,
      auto_enroll,
    }: {
      webinarId: string;
      recording_url: string;
      title?: string;
      price?: number;
      auto_enroll?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await instance.post(`webinars/${webinarId}/publish-recording`, {
        recording_url,
        title,
        price,
        auto_enroll,
      });
      const count = res.data?.data?.enrolled_count ?? 0;
      Toast.show({
        type: 'success',
        text1: 'Recording published',
        text2: count ? `${count} registrant(s) given access` : undefined,
        position: 'top',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to publish recording';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

// Manually grant a user access to a webinar (creator/owner) ---------
export const grantWebinarAccess = createAsyncThunk(
  'webinar/grantAccess',
  async ({ webinarId, phone }: { webinarId: string; phone: string }, { rejectWithValue }) => {
    try {
      const res = await instance.post(`webinars/${webinarId}/grant`, { phone });
      const alreadyEnrolled = res.data?.data?.alreadyEnrolled;
      Toast.show({
        type: 'success',
        text1: alreadyEnrolled ? 'User already has access' : 'Access granted',
        position: 'top',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to grant access';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

// Get Creator Webinar Stats
export const getCreatorWebinarStats = createAsyncThunk(
  'webinar/creatorStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await instance.get('webinars/stats/creator');
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch webinar stats');
    }
  },
);

export const WebinarSlice = createSlice({
  name: 'webinar',
  initialState: {
    creatorWebinarStats: null as any,
    current: null as any,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getCreatorWebinarStats.fulfilled, (state, { payload }) => {
        state.creatorWebinarStats = payload ?? null;
      })
      .addCase(getWebinarById.fulfilled, (state, { payload }) => {
        state.current = payload?.webinar ?? payload ?? null;
      });
  },
});

export default WebinarSlice?.reducer;
