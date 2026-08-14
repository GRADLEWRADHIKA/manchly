import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import { injectStore } from "../utils/axiosInstance";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Inject store into Axios interceptors AFTER creation.
// axiosInstance cannot import store directly (circular), so it exposes
// a setter that we call here, after both modules have been initialised.
injectStore(store);