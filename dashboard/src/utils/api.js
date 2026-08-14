import { BASE_URL } from "./backendConfig";
import { getDeviceId } from "./deviceId";

function resolveBase() {
  const env = (import.meta.env && import.meta.env.VITE_API_BASE) || "";
  if (env) return env.replace(/\/$/, "");
  if (import.meta.env && import.meta.env.DEV) return "/__api";
  return BASE_URL.replace(/\/$/, "");
}

export const API_BASE = resolveBase();

// Absolute backend origin (websockets, share links) — never the proxy path.
export const BACKEND_ORIGIN = BASE_URL.replace(/\/$/, "");

// The dashboard has historically stored the JWT under a couple of keys.
export function getToken() {
  return (
    localStorage.getItem("manchly_token") ||
    localStorage.getItem("token") ||
    ""
  );
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

// fetch wrapper:
//  - prepends API_BASE to a relative path ("/notifications/creator")
//  - injects the bearer token + JSON content-type (skipped for FormData)
//  - intercepts 401 Unauthorized to handle multi-device session terminations
//  - parses JSON and throws Error(message) on a non-2xx response
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
    // ── DEVICE_CONFLICT — fired on HTTP 403 + code=DEVICE_CONFLICT ──────────
    // AuthContext listens for this event and shows a non-dismissable modal,
    // clears tokens, and navigates to /auth after 3 s (or on user clicking OK).
    // Nothing per-component needs to handle this.
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

    // ── Session expired / unauthorized ──────────────────────────────────────
    if (res.status === 401) {
      clearToken();

      // Avoid infinite redirect loop if the request was an initial login attempt or already on /login
      const isLoginEndpoint = path.includes("/login") || path.includes("/auth/login");
      const isLoginPage = window.location.pathname.includes("/login");

      if (!isLoginEndpoint && !isLoginPage) {
        window.location.href = "/login?reason=session_expired";
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

// Most endpoints wrap their payload as { success, message, data, timestamp }.
// The /ai endpoints instead return { provider, data, latency_ms }. Both expose
// the useful payload under `.data`, so this unwrap handles them uniformly.
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