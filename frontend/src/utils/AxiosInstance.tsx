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
      return config;
    },
    (error: any) => Promise.reject(error),
  );

  // Response interceptor — handle 401 (expired/invalid token)
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      const status = error?.response?.status;

      if (status === 401) {
        const currentToken = store?.getState()?.userReducer?.token;
        if (currentToken) {
          // Token is expired or invalid — log the user out
          store?.dispatch({ type: 'User/logout' });
          Toast.show({
            type: 'error',
            text1: 'Session Expired',
            text2: 'Please login again',
            position: 'top',
          });
        }
      }

      return Promise.reject(error);
    },
  );
};

addTokenInterceptor(instance);
addTokenInterceptor(uploadInstance);
