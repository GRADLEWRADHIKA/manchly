import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { injectStore as injectAxiosStore } from "../utils/axiosInstance";
import { injectStore as injectApiStore } from "../../src/utils/api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});


injectAxiosStore(store);
injectApiStore(store);