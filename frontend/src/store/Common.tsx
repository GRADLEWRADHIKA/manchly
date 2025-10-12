import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { uploadInstance } from '../utils/AxiosInstance';


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
      console.log("---------failed uploadShipDoc error------>", error);
    }
  }
);
