const USE_LOCAL_BACKEND = true;

const LOCAL_IP = "10.0.2.2";
const LOCAL_PORT = 8080;

const LOCAL_URL = `http://${LOCAL_IP}:${LOCAL_PORT}/`;
const PRODUCTION_URL = "https://server.manchly.com/";

export const BASE_URL =
  __DEV__ && USE_LOCAL_BACKEND ? LOCAL_URL : PRODUCTION_URL;