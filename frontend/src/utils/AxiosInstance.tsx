import axios from 'axios';
import { BASE_URL } from './Urls';

let store: any;

export const injectStore = (_store: any) => {
  store = _store;
};




// getAccessToken();

export const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

const addTokenInterceptor = (axiosInstance: any) => {
  axiosInstance.interceptors.request.use(
    async (config: any) => {
      const token = store?.getState()?.userReducer?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    },
  );
};

addTokenInterceptor(instance);
addTokenInterceptor(uploadInstance);
