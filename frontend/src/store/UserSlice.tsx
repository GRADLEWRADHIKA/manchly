import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

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

export const verifyPAN = createAsyncThunk('kyc/verifyPAN', async (panNumber: string) => {
  try {
    const url = 'kyc/verify-pan';
    const response = await instance.post(url, { pan_number: panNumber });
    Toast.show({
      type: 'success',
      text1: 'PAN verified successfully',
      position: 'bottom',
    });
    return response.data;
  } catch (error: any) {
    let errorMessage = 'Invalid PAN number';
    let isNotImplemented = false;
    
    try {
      if (error?.request?._response) {
        const err = JSON.parse(error.request._response);
        errorMessage = err?.error?.message || err?.message || errorMessage;
        if (
          errorMessage.toLowerCase().includes('development') ||
          errorMessage.toLowerCase().includes('not implemented') ||
          errorMessage.toLowerCase().includes('coming soon') ||
          error?.response?.status === 404 ||
          error?.response?.status === 501
        ) {
          isNotImplemented = true;
          errorMessage = 'KYC feature is not yet available. Please contact support.';
        }
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        if (
          errorMessage.toLowerCase().includes('development') ||
          errorMessage.toLowerCase().includes('not implemented') ||
          errorMessage.toLowerCase().includes('coming soon')
        ) {
          isNotImplemented = true;
          errorMessage = 'KYC feature is not yet available. Please contact support.';
        }
      } else if (error?.response?.status === 404 || error?.response?.status === 501) {
        isNotImplemented = true;
        errorMessage = 'KYC feature is not yet available. Please contact support.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
    } catch (parseError) {
    }
    
    Toast.show({
      type: 'error',
      text1: isNotImplemented ? 'Feature Not Available' : 'PAN Verification Failed',
      text2: errorMessage,
      position: 'bottom',
    });
    throw error;
  }
});

export const verifyKYC = createAsyncThunk(
  'kyc/verify',
  async (data: { pan_number: string; user_name: string; user_dob: string }) => {
    try {
      const url = 'kyc/verify';
      const response = await instance.post(url, data);
      
      const result = response.data?.data;
      if (result?.verified) {
        Toast.show({
          type: 'success',
          text1: 'KYC Verified Successfully!',
          text2: 'Your identity has been verified',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'KYC Verification Failed',
          text2: 'PAN details do not match your information',
          position: 'bottom',
        });
      }
      return response.data;
    } catch (error: any) {
      let errorMessage = 'Verification failed';
      let isNotImplemented = false;
      
      try {
        if (error?.request?._response) {
          const err = JSON.parse(error.request._response);
          errorMessage = err?.error?.message || err?.message || errorMessage;
          // Check if it's a "not implemented" or "in development" message
          if (
            errorMessage.toLowerCase().includes('development') ||
            errorMessage.toLowerCase().includes('not implemented') ||
            errorMessage.toLowerCase().includes('coming soon') ||
            error?.response?.status === 404 ||
            error?.response?.status === 501
          ) {
            isNotImplemented = true;
            errorMessage = 'KYC verification feature is not yet available. Please contact support.';
          }
        } else if (error?.response?.data?.message) {
          errorMessage = error.response.data.message;
          if (
            errorMessage.toLowerCase().includes('development') ||
            errorMessage.toLowerCase().includes('not implemented') ||
            errorMessage.toLowerCase().includes('coming soon')
          ) {
            isNotImplemented = true;
            errorMessage = 'KYC verification feature is not yet available. Please contact support.';
          }
        } else if (error?.response?.status === 404 || error?.response?.status === 501) {
          isNotImplemented = true;
          errorMessage = 'KYC verification feature is not yet available. Please contact support.';
        } else if (error?.message) {
          errorMessage = error.message;
        }
      } catch (parseError) {
        // If parsing fails, use default message
      }
      
      Toast.show({
        type: 'error',
        text1: isNotImplemented ? 'Feature Not Available' : 'KYC Verification Failed',
        text2: errorMessage,
        position: 'bottom',
      });
      throw error;
    }
  }
);

export const getKYCStatus = createAsyncThunk('kyc/status', async () => {
  try {
    const url = 'kyc/status';
    const response = await instance.get(url);
    return response.data;
  } catch (error: any) {
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
  },
  reducers: {
    logout: state => {
      state.user = {};
      state.isAuth = false;
      state.token = '';
      state.kycStatus = null;
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
      .addCase(verifyOtp.rejected, state => {
        state.loading = false;
      })
      .addCase(verifyPAN.pending, state => {
        state.kycVerifying = true;
      })
      .addCase(verifyPAN.fulfilled, (state, action) => {
        state.kycVerifying = false;
      })
      .addCase(verifyPAN.rejected, state => {
        state.kycVerifying = false;
      })
      .addCase(verifyKYC.pending, state => {
        state.kycVerifying = true;
      })
      .addCase(verifyKYC.fulfilled, (state, action) => {
        state.kycVerifying = false;
        state.kycStatus = action.payload?.data;
      })
      .addCase(verifyKYC.rejected, state => {
        state.kycVerifying = false;
      })
      .addCase(getKYCStatus.fulfilled, (state, action) => {
        state.kycStatus = action.payload?.data;
      });
  },
});

export const { logout } = UserSlice?.actions;

export default UserSlice?.reducer;
