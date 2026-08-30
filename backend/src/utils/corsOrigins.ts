/**
 * One CORS allowlist, shared by the Express app and the Socket.IO server.
 *
 * They used to keep separate lists, which drifted: the dashboard's dev origin
 * was allowed for REST but not for sockets, and neither knew about the
 * deployed Netlify site.
 */

/** Exact origins. CORS_ORIGINS replaces this list entirely. */
export const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [
      "https://manchly.com",
      "https://www.manchly.com",
      "https://server.manchly.com",
      "http://localhost:8081",
      // Manchly web dashboard (vite dev + preview)
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:4173",
    ];

/**
 * Families of origins that cannot be listed one by one:
 *   *.manchly.com  — creator storefronts each get their own subdomain
 *   *.netlify.app  — the dashboard, including per-deploy preview URLs
 */
export const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/([a-z0-9-]+\.)*manchly\.com$/i,
  /^https:\/\/[a-z0-9-]+\.netlify\.app$/i,
];

export function isAllowedOrigin(origin?: string | null): boolean {
  // No Origin header at all: curl, server-to-server, same-origin navigation.
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

/** cors()-compatible callback. Refuses without throwing, so a blocked origin
 *  reads as a normal CORS failure rather than a 500. */
export function corsOriginCheck(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (isAllowedOrigin(origin)) return callback(null, true);
  console.warn(`CORS: blocked origin ${origin}`);
  return callback(null, false);
}
