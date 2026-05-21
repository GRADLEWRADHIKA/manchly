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
      console.log('---response---', response)
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
    const url = 'kyc/verify';
    const response = await instance.post(url, data);
    return response.data;
  } catch (error: any) {
    let errorMessage = 'PAN verification failed';
    try {
      if (error?.request?._response) {
        const err = JSON.parse(error.request._response);
        errorMessage = err?.message || err?.error?.message || errorMessage;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
    } catch (parseError) {}
    Toast.show({
      type: 'error',
      text1: 'Verification Failed',
      text2: errorMessage,
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

export const { logout, clearJustLoggedIn } = UserSlice?.actions;

export default UserSlice?.reducer;