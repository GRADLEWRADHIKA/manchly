import axios from "axios";
import { toast } from "./toast";
import { logout } from "../store/authSlice";
import { BASE_URL } from "./backendConfig";
import { getDeviceId } from "./deviceId";

const axiosInstance = axios.create({
  baseURL: BASE_URL.replace(/\/$/, ""),
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

let _store = null;
export const injectStore = (store) => {
  _store = store;
};

// Trigger unified logout across Redux, AuthContext, and LocalStorage
function _triggerGlobalLogout(reasonMessage) {
  if (_store) _store.dispatch(logout());
  window.dispatchEvent(
    new CustomEvent("manchly:force-logout", {
      detail: { message: reasonMessage },
    })
  );
}

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      _store?.getState()?.auth?.token ||
      localStorage.getItem("manchly_token") ||
      localStorage.getItem("auth_token") ||
      "";

    const deviceId = getDeviceId();

    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    if (deviceId) config.headers["X-Device-Id"] = deviceId;

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // ── a) 403 + DEVICE_CONFLICT ─────────────────────────────────────────────
    if (status === 403 && data?.code === "DEVICE_CONFLICT") {
      const msg =
        data?.message ||
        "You have been logged out because your account was signed in on another device.";
      toast.error(msg, { duration: 5000 });
      _triggerGlobalLogout(msg);
      return Promise.reject(error);
    }

    // ── b) 401 + DEVICE_REVOKED ──────────────────────────────────────────────
    if ((status === 401 || status === 403) && data?.code === "DEVICE_REVOKED") {
      const msg =
        data?.message ||
        "Your account was signed in on another device. You have been logged out.";
      toast.error(msg, { duration: 5000 });
      _triggerGlobalLogout(msg);
      return Promise.reject(error);
    }

    // ── c) 401 generic ───────────────────────────────────────────────────────
    if (status === 401) {
      toast.error("Your session has expired. Please login again.", {
        duration: 5000,
      });
      _triggerGlobalLogout("Session expired");
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;