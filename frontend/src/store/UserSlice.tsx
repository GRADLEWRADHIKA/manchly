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
  async (data: object, { rejectWithValue }) => {
    try {
      const url = 'auth/send-otp/sms';
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      // "OTP already sent" is handled by advancing to the OTP screen — don't scare the user with an error toast.
      if (apiError?.code !== 'OTP_ALREADY_SENT') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: getApiErrorMessage(error, 'Failed to send OTP'),
          position: 'top',
        });
      }
      return rejectWithValue(
        apiError || { message: getApiErrorMessage(error, 'Failed to send OTP') },
      );
    }
  },
);

export const sendOtpEmail = createAsyncThunk(
  'sendOtpEmail',
  async (data: object, { rejectWithValue }) => {
    try {
      const url = 'auth/send-otp/email';
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error: any) {
      const apiError = error?.response?.data?.error;
      // "OTP already sent" is handled by advancing to the OTP screen — don't scare the user with an error toast.
      if (apiError?.code !== 'OTP_ALREADY_SENT') {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: getApiErrorMessage(error, 'Failed to send OTP'),
          position: 'top',
        });
      }
      return rejectWithValue(
        apiError || { message: getApiErrorMessage(error, 'Failed to send OTP') },
      );
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
      position: 'top',
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
    console.log('-----RESPOSE----', response);

    return response;
  } catch (error: any) {
    console.log('------ERROR-----', JSON.parse(error));
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: getApiErrorMessage(error, 'Signup failed'),
      position: 'top',
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
      position: 'top',
    });
    throw error;
  }
});

// Refresh current user data from backend
export const getCurrentUser = createAsyncThunk('getCurrentUser', async () => {
  const response = await instance.get('auth/me');
  return response;
});

// Resend OTP
export const resendOtp = createAsyncThunk('resendOtp', async (data: object) => {
  try {
    const response = await instance.post('auth/resend-otp', data);
    Toast.show({type: 'success', text1: 'OTP Resent', position: 'top'});
    return response;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: getApiErrorMessage(error, 'Failed to resend OTP'),
      position: 'top',
    });
    throw error;
  }
});

// Subscription Management
export const getMySubscription = createAsyncThunk('getMySubscription', async () => {
  const response = await instance.get('subscriptions/me');
  return response.data;
});

export const createSubscriptionCheckout = createAsyncThunk(
  'createSubscriptionCheckout',
  async (data: object) => {
    try {
      const response = await instance.post('subscriptions/checkout', data);
      return response.data;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getApiErrorMessage(error, 'Failed to create checkout'),
        position: 'top',
      });
      throw error;
    }
  },
);

export const verifySubscription = createAsyncThunk(
  'verifySubscription',
  async (data: object) => {
    try {
      const response = await instance.post('subscriptions/verify', data);
      Toast.show({type: 'success', text1: 'Premium activated!', position: 'top'});
      return response.data;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getApiErrorMessage(error, 'Verification failed'),
        position: 'top',
      });
      throw error;
    }
  },
);

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
      position: 'top',
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
      .addCase(getMySubscription.fulfilled, (state, actions) => {
        const sub = actions?.payload?.data;
        if (sub) {
          state.user = {
            ...state.user,
            is_premium: sub.is_premium,
            isPremium: sub.is_premium,
          };
        }
      })
      .addCase(verifySubscription.fulfilled, (state) => {
        state.user = {
          ...state.user,
          is_premium: true,
          isPremium: true,
        };
      })
      .addCase(getCurrentUser.fulfilled, (state, actions) => {
        const updatedUser = actions?.payload?.data?.data?.user;
        if (updatedUser) {
          const currentUserType = state.user?.user_type;
          state.user = { ...updatedUser, user_type: currentUserType || updatedUser?.user_type };
        }
      })
      .addCase(verifyOtp.rejected, state => {
        state.loading = false;
      })
  },
});

export const { logout, clearJustLoggedIn, incrementProfileView, setPremiumStatus } =
  UserSlice?.actions;

export default UserSlice?.reducer;