import axios from 'axios';
import { BASE_URL } from './Urls';
import Toast from 'react-native-toast-message';

let store: any;

export const injectStore = (_store: any) => {
  store = _store;
};

export const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const addTokenInterceptor = (axiosInstance: any) => {
  // Request interceptor — attach token
  axiosInstance.interceptors.request.use(
    async (config: any) => {
      const token = store?.getState()?.userReducer?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      console.log('➡️ REQUEST', config.method?.toUpperCase(), (config.baseURL || '') + config.url);
      console.log('➡️ BODY', JSON.stringify(config.data, null, 2));

      return config;
    },
    (error: any) => Promise.reject(error),
  );

  // Response interceptor — handle 401 (expired/invalid token)
  axiosInstance.interceptors.response.use(
    (response: any) => {
      console.log('✅ RESPONSE', response.status, response.config.url);
      console.log('✅ DATA', JSON.stringify(response.data, null, 2));
      return response;
    },
    (error: any) => {
      const status = error?.response?.status;
      const code = error?.response?.data?.code;

      console.log('❌ ERROR STATUS', status);
      console.log('❌ ERROR URL', error?.config?.url);
      console.log('❌ ERROR DATA', JSON.stringify(error?.response?.data, null, 2));
      console.log('❌ ERROR REQUEST BODY', error?.config?.data);

      if (status === 401 || status === 403) {
        const currentToken = store?.getState()?.userReducer?.token;
        if (currentToken) {
          // Token is expired, invalid, or forbidden — log the user out
          store?.dispatch({ type: 'User/logout' });
          const deviceRevoked = code === 'DEVICE_REVOKED';
          Toast.show({
            type: 'error',
            text1: deviceRevoked
              ? 'Logged out'
              : status === 401
              ? 'Session Expired'
              : 'Access Denied',
            text2: deviceRevoked
              ? 'Your account was signed in on another device.'
              : 'Please login again',
            position: 'top',
            visibilityTime: 5000,
          });
        }
      }

      return Promise.reject(error);
    },
  );
};

addTokenInterceptor(instance);
addTokenInterceptor(uploadInstance);