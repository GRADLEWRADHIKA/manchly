import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { clearOtp as storageClearOtp, getOtp as storageGetOtp, saveOtp as storageSaveOtp } from '../screens/Auth/OtpStorage';

type AuthState = {
  otp: string | null;
  isLoggedIn: boolean;
  initializing: boolean; // true while we check storage on app start
  error: string | null;
};

const initialState: AuthState = {
  otp: null,
  isLoggedIn: false,
  initializing: true,
  error: null,
};

// Load OTP from storage on app start
export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  const saved = await storageGetOtp();
  return saved; // string | null
});

// Verify demo OTP and save if valid
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (entered: string, { rejectWithValue }) => {
    // Demo rule — replace with your real verification call if needed
    if (entered !== '1234') {
      return rejectWithValue('Incorrect code. For demo, use 1234.');
    }
    const ok = await storageSaveOtp(entered);
    if (!ok) return rejectWithValue('Could not save the code. Please try again.');
    return entered;
  }
);

// Clear OTP from storage
export const clearStoredOtp = createAsyncThunk('auth/clearStoredOtp', async (_, { rejectWithValue }) => {
  const ok = await storageClearOtp();
  if (!ok) return rejectWithValue('Could not clear the saved code.');
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      // bootstrap
      .addCase(bootstrapAuth.pending, state => {
        state.initializing = true;
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.otp = action.payload;
        state.isLoggedIn = !!action.payload;
        state.initializing = false;
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.initializing = false;
        state.error = 'Failed to load saved OTP.';
      })
      // verify
      .addCase(verifyOtp.pending, (state) => {
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.otp = action.payload as string;
        state.isLoggedIn = true;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Verification failed.';
      })
      // clear
      .addCase(clearStoredOtp.fulfilled, (state) => {
        state.otp = null;
        state.isLoggedIn = false;
        state.error = null;
      })
      .addCase(clearStoredOtp.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to clear OTP.';
      });
  },
});

export default authSlice.reducer;
