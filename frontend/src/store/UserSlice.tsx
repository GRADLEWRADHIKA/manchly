import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';
import NotificationService from '../services/NotificationService';

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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: response?.error?.message,
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
        text1: 'Error',
        text2: response?.error?.message,
        position: 'bottom',
      });
      throw error;
    }
  },
);

export const verifyOtp = createAsyncThunk('verifyOtp', async (data: object) => {
  try {
    const url = 'auth/verify-otp';
    const requestBody = data;
    const response = await instance.post(url, requestBody);
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
  } catch (error: any) {
    let errorMessage = 'Signup failed';
    try {
      if (error?.request?._response) {
        const err = JSON.parse(error.request._response);
        errorMessage = err?.msg || err?.error?.message || errorMessage;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
    } catch (parseError) {
    }

    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: errorMessage,
      position: 'bottom',
    });
    throw error;
  }
});

export const checkAuthData = createAsyncThunk('checkAuthData', async (data: object) => {
  try {
    const url = 'auth/check-user';
    const requestBody = data;
    const response = await instance.post(url, requestBody);
    return response;
  } catch (error) {
    const err = JSON.parse(error?.request?._response);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: err?.msg || err?.error?.message,
      position: 'bottom',
    });
    throw error;
  }
});

export const verifyPAN = createAsyncThunk('verifyPAN', async (data: object) => {
  try {
    const url = 'kyc/verify-pan';
    const response = await instance.post(url, data);
    Toast.show({
      type: 'success',
      text1: 'PAN verified successfully',
      position: 'bottom',
    });
    return response.data;
  } catch (error: any) {

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
    kycStatus: null as any,
    kycVerifying: false,
  },
  reducers: {
    logout: state => {
      state.user = {};
      state.isAuth = false;
      state.token = '';
      state.kycStatus = null;
      // Remove FCM token on logout
      NotificationService.removeToken();
    },
  },
  extraReducers: builder => {
    builder
      .addCase(verifyOtp.pending, state => {
        state.loading = true;
      })
      .addCase(verifyOtp.fulfilled, (state, actions) => {
        state.user = actions?.payload?.data?.data?.user;
        state.token = actions?.payload?.data?.data?.token;
        state.loading = false;
      })
      .addCase(updateProfile.fulfilled, (state, actions) => {
        state.user = actions?.payload?.data?.data?.user;
        state.loading = false;
      })
      .addCase(verifyPAN.fulfilled, (state, actions) => {
        state.user = actions?.payload?.data?.user;
        state.loading = false;
      })
      .addCase(verifyOtp.rejected, state => {
        state.loading = false;
      })
  },
});

export const { logout } = UserSlice?.actions;

export default UserSlice?.reducer;