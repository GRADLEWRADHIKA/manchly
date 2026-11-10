// Redux auth slice — source of truth for user identity and session token.
//
// Token storage keys:
//   "manchly_token"  ← primary key used by AuthContext + apiFetch + axiosInstance
//   "auth_token"     ← legacy key kept for backward compat (read-only fallback)
//
// The loginUser thunk automatically merges device_id, device_name, and platform
// into the payload before sending to the backend, so callers only pass creds.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";
import { getDeviceInfo } from "../utils/deviceId";

// Hydrate from localStorage on cold boot
const initialToken =
  localStorage.getItem("manchly_token") ||
  localStorage.getItem("auth_token") ||
  null;

const initialState = {
  user: (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })(),
  token: initialToken,
  isAuth: !!initialToken,
  loading: false,
  error: null,
};

// ─── Async thunk ──────────────────────────────────────────────────────────────
// Merges device fingerprint into credentials before POST /auth/login.
// Backend uses device_id, device_name, platform to enforce single-device policy.
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      // getDeviceInfo() reads/creates the stable UUID in localStorage.
      // This is the same ID attached to every subsequent request via axiosInstance.
      const deviceInfo = getDeviceInfo(); // { device_id, device_name, platform }

      const response = await axiosInstance.post("/auth/login", {
        ...credentials,
        ...deviceInfo,
      });

      const { token, user } = response.data;

      // Persist under the primary key so AuthContext + apiFetch pick it up too
      localStorage.setItem("manchly_token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      return { token, user };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        "Login failed. Please try again.";
      return rejectWithValue(message);
    }
  },
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Called by:
    //  - axiosInstance interceptors on 401/DEVICE_REVOKED
    //  - socketService force_logout handler in App.jsx
    //  - user-initiated logout buttons
    //
    // Intentionally does NOT remove "device_id" — the device fingerprint must
    // survive logout so the same browser always sends the same ID on next login.
    logout(state) {
      state.user    = null;
      state.token   = null;
      state.isAuth  = false;
      state.loading = false;
      state.error   = null;

      localStorage.removeItem("manchly_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },

    // Lightweight patch used by AuthContext.updateUser and profile screens
    setUser(state, action) {
      state.user = { ...(state.user || {}), ...action.payload };
      localStorage.setItem("user", JSON.stringify(state.user));
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token   = action.payload.token;
        state.user    = action.payload.user;
        state.isAuth  = true;
        state.error   = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;