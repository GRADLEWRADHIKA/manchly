import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  clearAuth as storageClearAuth,
  getAuth as storageGetAuth,
  saveAuth as storageSaveAuth,
  StoredAuth,
} from '../screens/Auth/OtpStorage';

type AuthState = {
  otp: string | null;
  userType: string | null;
  isLoggedIn: boolean;
  initializing: boolean; // true while we check storage on app start
  error: string | null;
};

const initialState: AuthState = {
  otp: null,
  userType: null,
  isLoggedIn: false,
  initializing: true,
  error: null,
};

// Load OTP + userType from storage on app start
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const saved: StoredAuth = await storageGetAuth();
  return saved; // { otp, userType }
});

type VerifyPayload = { entered: string; userType?: string | null };

// Verify demo OTP and save if valid
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: VerifyPayload, { rejectWithValue }) => {
    const { entered, userType = null } = payload;
    // Demo rule — replace with your real verification call if needed
    if (entered !== '1234') {
      return rejectWithValue('Incorrect code. For demo, use 1234.');
    }
    const ok = await storageSaveAuth(entered, userType ?? null);
    if (!ok) return rejectWithValue('Could not save the code. Please try again.');
    return { otp: entered, userType: userType ?? null };
  }
);

// Clear OTP and userType from storage
export const clearStoredAuth = createAsyncThunk(
  'auth/clearStoredAuth',
  async (_, { rejectWithValue }) => {
    const ok = await storageClearAuth();
    if (!ok) return rejectWithValue('Could not clear the saved data.');
    return true;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // optionally expose a sync action to set userType/otp in-memory
    setUserType(state, action: PayloadAction<string | null>) {
      state.userType = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      // bootstrap
      .addCase(bootstrapAuth.pending, state => {
        state.initializing = true;
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        const payload = action.payload as StoredAuth;
        state.otp = payload.otp;
        state.userType = payload.userType;
        state.isLoggedIn = !!payload.otp;
        state.initializing = false;
      })
      .addCase(bootstrapAuth.rejected, state => {
        state.initializing = false;
        state.error = 'Failed to load saved auth data.';
      })
      // verify
      .addCase(verifyOtp.pending, state => {
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        const payload = action.payload as { otp: string; userType: string | null };
        state.otp = payload.otp;
        state.userType = payload.userType;
        state.isLoggedIn = true;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Verification failed.';
      })
      // clear
      .addCase(clearStoredAuth.fulfilled, state => {
        state.otp = null;
        state.userType = null;
        state.isLoggedIn = false;
        state.error = null;
      })
      .addCase(clearStoredAuth.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to clear auth data.';
      });
  },
});

export const { setUserType } = authSlice.actions;
export default authSlice.reducer;
