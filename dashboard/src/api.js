// Shared API base + helpers for the Manchly dashboard.
//
// Base resolution (so the same build works locally AND when hosted behind a
// Cloudflare tunnel / served by the backend):
//   1. VITE_API_BASE if provided (explicit override).
//   2. Otherwise, if the page is served from anything other than a local dev
//      box, the API is assumed to live on the SAME origin (tunnel / backend).
//   3. Otherwise fall back to the local backend on :8080 (vite dev on :5173).
function resolveBase() {
  const env = (import.meta.env && import.meta.env.VITE_API_BASE) || "";
  if (env) return env.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location) {
    const h = window.location.hostname;
    if (h && h !== "localhost" && h !== "127.0.0.1") return window.location.origin;
  }
  return "http://localhost:8080";
}

export const API_BASE = resolveBase();

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
