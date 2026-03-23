import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { instance, uploadInstance } from '../utils/AxiosInstance';


// calling the upload file api
export const uploadShipDoc = createAsyncThunk(
  "uploadShipDoc",
  async (data: object) => {
    try {
      const url = "upload";
      const requestBody = data;
      const response = await uploadInstance.post(url, requestBody);
      return response?.data;
    } catch (error: any) {

    }
  }
);

// create courses api call
export const createCourse = createAsyncThunk(
  'createCourse',
  async (data: object) => {
    try {
      const url = 'mux/assets';
      const requestBody = data;
      const response = await instance.post(url, requestBody);
      return response;
    } catch (error) {
      const response = JSON.parse(error?.request?._response || '{}');
      throw error;
    }
  },
);