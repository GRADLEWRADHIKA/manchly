// Backend selection — same pattern as the mobile app (manApp/src/utils/Urls.tsx).
// Flip USE_LOCAL_BACKEND to true to develop against your local manBackend.
// Imported by BOTH the app (utils/api.js) and vite.config.js (dev proxy target),
// so keep this file plain ESM with no vite/browser APIs.
const USE_LOCAL_BACKEND = true;

const LOCAL_IP = "localhost"; // web equivalent of the app's 10.0.2.2 emulator loopback
const LOCAL_PORT = 8080;

const LOCAL_URL = `http://${LOCAL_IP}:${LOCAL_PORT}`;
const PRODUCTION_URL = "https://server.manchly.com";

// A deployed build (Netlify) must never point at localhost, and it needs the
// real origin for websockets too — not just for REST — so the override lives
// here rather than only in api.js. VITE_BACKEND_URL wins over the flag above.
// Read defensively: this module is also imported by vite.config.js in Node,
// where import.meta.env does not exist.
function envBackendUrl() {
  try {
    const env = import.meta.env;
    return (env && (env.VITE_BACKEND_URL || env.VITE_API_BASE)) || "";
  } catch {
    return "";
  }
}

const OVERRIDE = envBackendUrl();

export const BASE_URL = (
  OVERRIDE || (USE_LOCAL_BACKEND ? LOCAL_URL : PRODUCTION_URL)
).replace(/\/$/, "");
