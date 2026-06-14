import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { instance } from '../utils/AxiosInstance';

export const getCreatorNotifications = createAsyncThunk(
  'notifications/getCreator',
  async (params: { page?: number; type?: string } = {}, { rejectWithValue }) => {
    try {
      const res = await instance.get('notifications/creator', { params });
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch notifications');
    }
  },
);

export const getUserNotifications = createAsyncThunk(
  'notifications/getUser',
  async (params: { page?: number; type?: string } = {}, { rejectWithValue }) => {
    try {
      const res = await instance.get('notifications/user', { params });
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch notifications');
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id: string, { rejectWithValue }) => {
    try {
      await instance.put(`notifications/${id}/read`);
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to mark as read');
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await instance.put('notifications/read-all');
      return true;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed');
    }
  },
);

export const getUnreadCount = createAsyncThunk(
  'notifications/getUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await instance.get('notifications/unread-count');
      return res.data?.data?.count || 0;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed');
    }
  },
);

export interface Notification {
  _id: string;
  type: 'sale' | 'session' | 'webinar' | 'system' | 'course' | 'expert';
  title: string;
  message: string;
  is_read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getCreatorNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCreatorNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload || [];
      })
      .addCase(getCreatorNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getUserNotifications.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload || [];
      })
      .addCase(getUserNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const n = state.notifications.find(n => n._id === action.payload);
        if (n && !n.is_read) {
          n.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, state => {
        state.notifications.forEach(n => (n.is_read = true));
        state.unreadCount = 0;
      })
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export default notificationSlice.reducer;
