import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';
import NotificationService from '../services/NotificationService';
import { getApiErrorMessage } from '../utils/apiError';

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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getApiErrorMessage(error, 'Failed to send OTP'),
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
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getApiErrorMessage(error, 'Failed to send OTP'),
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
    Toast.show({
      type: 'error',
      text1: 'Verification Failed',
      text2: getApiErrorMessage(error, 'Invalid OTP'),
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
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: getApiErrorMessage(error, 'Signup failed'),
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
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: getApiErrorMessage(error, 'Unable to verify account'),
      position: 'bottom',
    });
    throw error;
  }
});

export const verifyPAN = createAsyncThunk('verifyPAN', async (data: object) => {
  try {
    const url = 'kyc/verify';
    const response = await instance.post(url, data);
    return response.data;
  } catch (error: any) {
    Toast.show({
      type: 'error',
      text1: 'Verification Failed',
      text2: getApiErrorMessage(error, 'PAN verification failed'),
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
    kycStatus: null as any,
    kycVerifying: false,
    justLoggedIn: false,
  },
  reducers: {
    logout: state => {
      state.user = {};
      state.isAuth = false;
      state.token = '';
      state.kycStatus = null;
      state.justLoggedIn = false;
      // Remove FCM token on logout
      NotificationService.removeToken();
    },
    clearJustLoggedIn: state => {
      state.justLoggedIn = false;
    },
    incrementProfileView: state => {
      const current =
        state.user?.profile_views_used ??
        state.user?.profileViewsUsed ??
        state.user?.marketplace_profile_views ??
        0;

      const nextCount = Number(current) + 1;

      state.user = {
        ...state.user,
        profile_views_used: nextCount,
        profileViewsUsed: nextCount,
        marketplace_profile_views: nextCount,
      };
    },
    setPremiumStatus: (state, action) => {
      state.user = {
        ...state.user,
        is_premium: action.payload,
        isPremium: action.payload,
      };
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
        state.justLoggedIn = true;
      })
      .addCase(signUp.fulfilled, (state, actions) => {
        const data = actions?.payload?.data?.data;
        if (data?.user) {
          state.user = data.user;
        }
        if (data?.token) {
          state.token = data.token;
          state.isAuth = true;
          state.justLoggedIn = true;
        }
        state.loading = false;
      })
      .addCase(updateProfile.fulfilled, (state, actions) => {
        const updatedUser = actions?.payload?.data?.data?.user;
        // Always preserve the user_type from login — never let updateProfile overwrite it
        const currentUserType = state.user?.user_type;
        state.user = { ...updatedUser, user_type: currentUserType || updatedUser?.user_type };
        state.loading = false;
      })
      .addCase(verifyPAN.fulfilled, (state, actions) => {
        if (actions?.payload?.data?.user) {
          state.user = actions.payload.data.user;
        }
        state.loading = false;
      })
      .addCase(verifyOtp.rejected, state => {
        state.loading = false;
      })
  },
});

export const { logout, clearJustLoggedIn, incrementProfileView, setPremiumStatus } =
  UserSlice?.actions;

export default UserSlice?.reducer;