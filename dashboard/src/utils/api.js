// Shared API base + helpers for the Manchly dashboard.
//
// The backend target comes from backendConfig.js (USE_LOCAL_BACKEND toggle,
// production https://server.manchly.com by default — same as the mobile app).
//
// In `npm run dev`, requests go through the vite proxy at /__api (same origin,
// so the production server's CORS allowlist never gets in the way); the proxy
// target in vite.config.js reads the same toggle. Production builds call the
// backend directly (VITE_API_BASE can still override, e.g. for a staging box).
import { BASE_URL } from "./backendConfig";

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
  return {
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

// fetch wrapper:
//  - prepends API_BASE to a relative path ("/notifications/creator")
//  - injects the bearer token + JSON content-type (skipped for FormData)
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
