// Backend selection — same pattern as the mobile app (manApp/src/utils/Urls.tsx).
// Flip USE_LOCAL_BACKEND to true to develop against your local manBackend.
// Imported by BOTH the app (utils/api.js) and vite.config.js (dev proxy target),
// so keep this file plain ESM with no vite/browser APIs.
const USE_LOCAL_BACKEND = false;

const LOCAL_IP = "localhost"; // web equivalent of the app's 10.0.2.2 emulator loopback
const LOCAL_PORT = 8080;

const LOCAL_URL = `http://${LOCAL_IP}:${LOCAL_PORT}`;
const PRODUCTION_URL = "https://server.manchly.com";

export const BASE_URL = USE_LOCAL_BACKEND ? LOCAL_URL : PRODUCTION_URL;
