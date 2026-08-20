import { BASE_URL } from "./backendConfig";
import { getDeviceId } from "./deviceId";
import { toast } from "./toast";

function resolveBase() {
  const env = (import.meta.env && import.meta.env.VITE_API_BASE) || "";
  if (env) return env.replace(/\/$/, "");
  if (import.meta.env && import.meta.env.DEV) return "/__api";
  return BASE_URL.replace(/\/$/, "");
}

export const API_BASE = resolveBase();

// Absolute backend origin (websockets, share links) — never the proxy path.
export const BACKEND_ORIGIN = BASE_URL.replace(/\/$/, "");

// ── Store injector ──────────────────────────────────────────────────────────
// apiFetch needs to dispatch Redux logout() on DEVICE_REVOKED / expired
// sessions, same as axiosInstance.js does. Call injectStore(store) once from
// store/index.js, alongside the existing injectStore call for axiosInstance.
let _store = null;
export const injectStore = (store) => {
  _store = store;
};

// The dashboard has historically stored the JWT under a couple of keys.
export function getToken() {
  return (
    localStorage.getItem("manchly_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function clearToken() {
  localStorage.removeItem("manchly_token");
  localStorage.removeItem("auth_token");
  localStorage.removeItem("token");
}

export function authHeaders(extra = {}) {
  const t = getToken();
  const deviceId = getDeviceId(); // never regenerated once set
  return {
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    // Attach device fingerprint on every request so the backend can detect
    // when a session is being used from a different browser/device.
    "X-Device-Id": deviceId,
    ...extra,
  };
}

function dispatchLogout() {
  if (_store) {
    import("../store/authSlice").then(({ logout }) => {
      _store.dispatch(logout());
    });
  }
}

function redirectToAuth() {
  if (!window.location.pathname.startsWith("/auth")) {
    window.location.href = "/auth?reason=session_expired";
  }
}

export async function apiFetch(path, opts = {}) {
  const url = /^https?:\/\//.test(path) ? path : `${API_BASE}${path}`;
  const isForm = opts.body instanceof FormData;
  const res = await fetch(url, {
    ...opts,
    headers: authHeaders({
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers || {}),
    }),
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    if (res.status === 403 && body?.code === "DEVICE_CONFLICT") {
      window.dispatchEvent(
        new CustomEvent("manchly:device-conflict", {
          detail: {
            message:
              body?.message ||
              "You have been logged out because your account was signed in on another device or browser.",
          },
        }),
      );
    }

    else if ((res.status === 401 || res.status === 403) && body?.code === "DEVICE_REVOKED") {
      clearToken();
      dispatchLogout();
      toast.error(
        body?.message ||
          "Your account was signed in on another device. You have been logged out.",
        { duration: 5000 },
      );
      redirectToAuth();
    }

    // ── Session expired / unauthorized (generic) ─────────────────────────────
    else if (res.status === 401) {
      clearToken();
      dispatchLogout();

      // Avoid infinite redirect loop if the request was an initial login attempt or already on /auth
      const isLoginEndpoint = path.includes("/login") || path.includes("/auth/login");
      const isAuthPage = window.location.pathname.startsWith("/auth");

      if (!isLoginEndpoint && !isAuthPage) {
        toast.error("Your session has expired. Please login again.", { duration: 5000 });
        redirectToAuth();
      }
    }

    const msg =
      body?.error?.message ||
      body?.message ||
      (typeof body?.error === "string" ? body.error : null) ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export function unwrap(body) {
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
}

// Helper for Promise.allSettled results.
// Returns the unwrapped payload when fulfilled, otherwise null.
export function val(result) {
  if (!result || result.status !== "fulfilled") {
    return null;
  }

  return unwrap(result.value);
}