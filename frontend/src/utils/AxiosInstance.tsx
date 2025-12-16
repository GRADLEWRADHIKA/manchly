import axios from 'axios';
import { BASE_URL } from './Urls';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAccessToken = async () => {
  let token;
  const localStorage = await AsyncStorage.getItem('persist:root');
  if (localStorage) {
    const data = JSON.parse(localStorage);
    const userData = data?.userReducer;
    if (userData) {
      const allUserData = JSON.parse(userData);
      token = allUserData?.token;
      setAuthToken(token);
    }
  }
};

getAccessToken();

// Function to set the Bearer token in the Authorization header
export const setAuthToken = (token: string) => {
  if (token) {
    console.log('----token-----', token)
    instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    uploadInstance.defaults.headers.common.Authorization = `bearer ${token}`;
  } else {
    delete instance.defaults.headers.common.Authorization;
    delete uploadInstance.defaults.headers.common.Authorization;
  }
};

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
