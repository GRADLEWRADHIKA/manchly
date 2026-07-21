/**
 * API base URL
 * ------------
 * The committed default points at PRODUCTION for every build, so the shared
 * branch never carries a personal LAN IP.
 *
 * To develop against your OWN local backend:
 *   1. set USE_LOCAL_BACKEND = true   (locally — please don't commit this)
 *   2. set LOCAL_IP to your machine's LAN IP (device must be on same Wi‑Fi)
 *        - Android emulator: use '10.0.2.2'
 *        - iOS simulator:    'localhost' or the LAN IP both work
 */

// Local-dev toggle — flip to true LOCALLY only. Keep false on shared branches.
//const USE_LOCAL_BACKEND = true;

const LOCAL_IP = "10.71.79.95";
const LOCAL_PORT = 8000;

const LOCAL_URL = `http://${LOCAL_IP}:${LOCAL_PORT}/`;
//const PRODUCTION_URL = "https://server.manchly.com/";

export const BASE_URL = LOCAL_URL;
