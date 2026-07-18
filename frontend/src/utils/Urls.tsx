/**
 * API base URL
 * ------------
 * Automatically uses the LOCAL backend in dev builds (Metro) and the
 * PRODUCTION backend in release/production builds — via React Native's
 * built-in `__DEV__` flag (true in dev, false in a release build).
 *
 *  • Set FORCE_PRODUCTION = true to hit production while still developing.
 *  • LOCAL_IP = this Mac's LAN IP (device must be on the same Wi‑Fi).
 *      - Android emulator: use '10.0.2.2'
 *      - iOS simulator:    'localhost' or the LAN IP both work
 */

// Flip to true to force the production API even during development.
const FORCE_PRODUCTION = false;

const LOCAL_IP = "192.168.1.8";
const LOCAL_PORT = 8080;

const LOCAL_URL = `http://${LOCAL_IP}:${LOCAL_PORT}/`;
const PRODUCTION_URL = "https://server.manchly.com/";

export const BASE_URL =
  __DEV__ && !FORCE_PRODUCTION ? LOCAL_URL : PRODUCTION_URL;
