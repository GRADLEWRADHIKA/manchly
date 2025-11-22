import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance, setAuthToken } from '../utils/AxiosInstance';

export interface taskState {
  user: any;
  loading: boolean;
  error: string;
}

export const sendOtpSms = createAsyncThunk(
  'sendOtpSms',
  async (data: object) => {
    try {
      const url = 'auth/send-otp/sms';
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      console.log('---response---', response);
      Toast.show({
        type: 'error',
        text1: response?.error?.message,
        position: 'bottom',
      });
      throw error;
    }
  },
);

export const sendOtpEmail = createAsyncThunk(
  'sendOtpEmail',
  async (data: object) => {
    try {
      const url = 'auth/send-otp/email';
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      Toast.show({
        type: 'error',
        text1: response?.error?.message,
        position: 'bottom',
      });
      console.log('---error in sending otp Email -----', error?.request);
      throw error;
    }
  },
);

export const verifyOtp = createAsyncThunk('verifyOtp', async (data: object) => {
  try {
    const url = 'auth/verify-otp';
    const requestBody = data;
    const response = await instance.post(url, requestBody);
    if (response.data) {
      setAuthToken(response?.data?.data?.token);
    }
    return response;
  } catch (error) {
    const err = error?.request?._response;
    const parsedError = JSON.parse(err);
    Toast.show({
      type: 'error',
      text1: parsedError?.error?.message,
      position: 'bottom',
    });
    throw error;
  }
});

// -------- update user -----------
export const updateProfile = createAsyncThunk(
  'updateProfile',
  async (data: object) => {
    try {
      const url = 'auth/profile';
      const requestBody = data;
      const response = await instance.put(url, requestBody);
      return response;
    } catch (error) {
      console.log('------error-----', error?.request);
      // const err = error?.request?._response;
      // const parsedError = JSON.parse(err);
      // Toast.show({
      //   type: 'error',
      //   text1: parsedError?.error?.message,
      //   position: 'bottom',
      // });
      throw error;
    }
  },
);

export const signUp = createAsyncThunk('signUp', async (data: object) => {
  try {
    const url = 'auth/signup';
    const requestBody = data;
    const response = await instance.post(url, requestBody);
    return response;
  } catch (error) {
    const err = JSON.parse(error?.request?._response);
    Toast.show({
      type: 'error',
      text1: err?.msg,
      position: 'bottom',
    });
    throw error;
  }
});

export const UserSlice = createSlice({
  name: 'User',
  initialState: {
    loading: false,
    error: '',
    user: {},
    token: '',
    isAuth: false,
  },
  reducers: {
    logout: state => {
      state.user = {};
      state.isAuth = false;
      state.token = '';
    },
  },
  extraReducers: builder => {
    builder.addCase(verifyOtp.pending, state => {
      state.loading = true;
    });
    builder.addCase(verifyOtp.fulfilled, (state, actions) => {
      state.user = actions?.payload?.data?.data?.user;
      state.token = actions?.payload?.data?.data?.token;
      state.loading = false;
    });
    builder.addCase(updateProfile.fulfilled, (state, actions) => {
      state.user = actions?.payload?.data?.data?.user;
      state.loading = false;
    });
    builder.addCase(verifyOtp.rejected, state => {
      state.loading = false;
    });
  },
});

export const { logout } = UserSlice?.actions;

export default UserSlice?.reducer;
