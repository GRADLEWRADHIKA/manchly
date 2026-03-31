import { configureStore, combineReducers } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import userReducer from './UserSlice'
import coursesReducer from './CourseSlice'
import videosReducer from './VideoSlice'
import enrollmentsReducer from './EnrollmentSlice'
import paymentReducer from './PaymentSlice'
import webinarReducer from './WebinarSlice'

const rootReducer = combineReducers({
  userReducer,
  coursesReducer,
  videosReducer,
  enrollmentsReducer,
  paymentReducer,
  webinarReducer,
});
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['userReducer'],
  blacklist: [''],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch