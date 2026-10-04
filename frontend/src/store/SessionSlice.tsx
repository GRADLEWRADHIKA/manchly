import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import {instance} from '../utils/AxiosInstance';

export const createSession = createAsyncThunk(
  'session/create',
  async (data: {receiver_id: string; mode: string; rate_per_min: number}) => {
    try {
      const response = await instance.post('sessions', data);
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const acceptSession = createAsyncThunk(
  'session/accept',
  async (sessionId: string) => {
    try {
      const response = await instance.patch(`sessions/${sessionId}/accept`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

export const endSession = createAsyncThunk(
  'session/end',
  async (data: {sessionId: string; duration: number}) => {
    try {
      const response = await instance.patch(`sessions/${data.sessionId}/end`, {
        duration: data.duration,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

export const getMySessions = createAsyncThunk(
  'session/getMySessions',
  async (params: {role?: string; status?: string; page?: number; limit?: number}) => {
    try {
      const query = new URLSearchParams();
      if (params.role) query.append('role', params.role);
      if (params.status) query.append('status', params.status);
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      const response = await instance.get(`sessions?${query.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

export const getSessionStats = createAsyncThunk(
  'session/getStats',
  async () => {
    try {
      const response = await instance.get('sessions/stats');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

export const getSessionByCallId = createAsyncThunk(
  'session/getByCallId',
  async (callId: string) => {
    try {
      const response = await instance.get(`sessions/call/${callId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

// Expert Profile
export const getMyExpertProfile = createAsyncThunk(
  'session/getMyExpert',
  async () => {
    const response = await instance.get('sessions/expert/me');
    return response.data;
  },
);

export const registerAsExpert = createAsyncThunk(
  'session/registerExpert',
  async (data: any) => {
    try {
      const response = await instance.post('sessions/expert/register', data);
      Toast.show({type: 'success', text1: 'Registered as session expert!', position: 'top'});
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const updateExpertProfile = createAsyncThunk(
  'session/updateExpert',
  async (data: any) => {
    const response = await instance.patch('sessions/expert/update', data);
    return response.data;
  },
);

// Manually grant a user access to a session product (creator/owner)
export const grantSessionAccess = createAsyncThunk(
  'session/grantAccess',
  async (
    {
      productId,
      phone,
      email,
    }: { productId: string; phone?: string; email?: string },
    { rejectWithValue },
  ) => {
    try {
      // ⚠️ CONFIRM THIS ROUTE with your backend
      const res = await instance.post(`sessions/products/${productId}/grant`, {
        phone,
        email,
      });
      const alreadyEnrolled = res.data?.data?.alreadyEnrolled;
      Toast.show({
        type: 'success',
        text1: alreadyEnrolled ? 'User already has access' : 'Access granted',
        position: 'top',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to grant access';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

export const createSessionProduct = createAsyncThunk(
  'session/createProduct',
  async (data: {
    title: string;
    description?: string;
    duration: number;
    price: number;
    mode: string;
    thumbnail_url?: string;
    categories?: string[];
    thankyou_message?: string;
  }) => {
    try {
      const response = await instance.post('sessions/products', data);
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const listExperts = createAsyncThunk(
  'session/listExperts',
  async (params: {category?: string; page?: number; limit?: number; search?: string}) => {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    const response = await instance.get(`sessions/experts?${query.toString()}`);
    return response.data;
  },
);

export const getExpertDetail = createAsyncThunk(
  'session/getExpertDetail',
  async (expertId: string) => {
    const response = await instance.get(`sessions/experts/${expertId}`);
    return response.data;
  },
);

export const getExpertAvailability = createAsyncThunk(
  'session/getAvailability',
  async (expertId: string, { rejectWithValue }) => {
    try {
      const response = await instance.get(`sessions/availability/${expertId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error?.message);
    }
  },
);

export const getExpertBookedSlots = createAsyncThunk(
  'session/getBookedSlots',
  async (expertId: string, { rejectWithValue }) => {
    try {
      const response = await instance.get(`sessions/experts/${expertId}/booked-slots`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data || error?.message);
    }
  },
);

// Availability Management
export const setAvailability = createAsyncThunk(
  'session/setAvailability',
  async (data: any) => {
    try {
      const response = await instance.post('sessions/availability', data);
      Toast.show({type: 'success', text1: 'Availability updated!', position: 'top'});
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const addAvailabilitySlot = createAsyncThunk(
  'session/addSlot',
  async (data: {day: string; start_time: string; end_time: string}) => {
    try {
      const response = await instance.post('sessions/availability/slot', data);
      Toast.show({type: 'success', text1: 'Slot added!', position: 'top'});
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const getMyAvailability = createAsyncThunk(
  'session/getMyAvailability',
  async () => {
    const response = await instance.get('sessions/availability/me');
    return response.data;
  },
);

export const removeAvailabilitySlot = createAsyncThunk(
  'session/removeSlot',
  async (slotId: string) => {
    await instance.delete(`sessions/availability/${slotId}`);
    Toast.show({type: 'success', text1: 'Slot removed', position: 'top'});
    return slotId;
  },
);

// Update Session Product
export const updateSessionProduct = createAsyncThunk(
  'session/updateProduct',
  async ({productId, data}: {productId: string; data: any}) => {
    try {
      const response = await instance.patch(`sessions/products/${productId}`, data);
      Toast.show({type: 'success', text1: 'Product updated!', position: 'top'});
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const getMySessionProducts = createAsyncThunk(
  'session/getMyProducts',
  async () => {
    try {
      const response = await instance.get('sessions/products/my');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

export const deleteSessionProduct = createAsyncThunk(
  'session/deleteProduct',
  async (productId: string) => {
    try {
      await instance.delete(`sessions/products/${productId}`);
      return productId;
    } catch (error: any) {
      throw error;
    }
  },
);

export const getCreatorSessionProducts = createAsyncThunk(
  'session/getCreatorProducts',
  async (creatorId: string) => {
    try {
      const response = await instance.get(`sessions/products/creator/${creatorId}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

export const getPopularSessionProducts = createAsyncThunk(
  'session/getPopularProducts',
  async (params: {limit?: number} = {}) => {
    const query = new URLSearchParams();
    if(params.limit) query.append('limit', String(params.limit));
    const response = await instance.get(`sessions/products/popular?${query.toString()}`);
    return response.data;
  }
)

export const bookSession = createAsyncThunk(
  'session/book',
  async (data: {expert_id: string; mode: string; duration?: number; scheduled_at: string}) => {
    try {
      const response = await instance.post('sessions/book', data);
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const verifySessionPayment = createAsyncThunk(
  'session/verifyPayment',
  async (data: {order_id: string}) => {
    try {
      const response = await instance.post('sessions/verify-payment', data);
      Toast.show({type: 'success', text1: 'Payment successful! Session booked.', position: 'top'});
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Payment verification failed', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const rateSession = createAsyncThunk(
  'session/rate',
  async (data: {session_id: string; rating: number; feedback?: string}) => {
    try {
      const response = await instance.post('sessions/rate', data);
      Toast.show({type: 'success', text1: 'Thanks for your feedback!', position: 'top'});
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'top'});
      throw error;
    }
  },
);

export const getExpertReviews = createAsyncThunk(
  'session/getExpertReviews',
  async (expertId: string, {rejectWithValue}) => {
    try {
      const res = await instance.get(`sessions/experts/${expertId}/reviews`);
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.error || 'Failed to fetch reviews',
      );
    }
  },
);

export const getDashboardStats = createAsyncThunk(
  'session/getDashboard',
  async () => {
    try {
      const response = await instance.get('sessions/dashboard');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
);

const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    sessions: [] as any[],
    stats: {total_sessions: 0, total_minutes: 0, total_earnings: 0},
    dashboard: null as any,
    products: [] as any[],
    popularProducts: [] as any[],
    popularProductsLoading: false,
    expertProfile: null as any,
    experts: [] as any[],
    availability: [] as any[],
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getMySessions.pending, state => {
        state.loading = true;
      })
      .addCase(getMySessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload?.data?.sessions || [];
      })
      .addCase(getMySessions.rejected, state => {
        state.loading = false;
      })
      .addCase(getSessionStats.fulfilled, (state, action) => {
        state.stats = action.payload?.data || state.stats;
      })
      .addCase(getDashboardStats.fulfilled, (state, action) => {
        state.dashboard = action.payload?.data || null;
      })
      .addCase(getMySessionProducts.fulfilled, (state, action) => {
        state.products = action.payload?.data || [];
      })
      .addCase(deleteSessionProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p: any) => p.id !== action.payload);
      })
      .addCase(getMyExpertProfile.fulfilled, (state, action) => {
        state.expertProfile = action.payload?.data || null;
      })
      .addCase(registerAsExpert.fulfilled, (state, action) => {
        state.expertProfile = action.payload?.data || null;
      })
      .addCase(updateExpertProfile.fulfilled, (state, action) => {
        state.expertProfile = action.payload?.data || null;
      })
      .addCase(listExperts.fulfilled, (state, action) => {
        state.experts = action.payload?.data?.experts || [];
      })
      .addCase(getMyAvailability.fulfilled, (state, action) => {
        state.availability = action.payload?.data || [];
      })
      .addCase(removeAvailabilitySlot.fulfilled, (state, action) => {
        state.availability = state.availability.filter((s: any) => s.id !== action.payload);
      })
      .addCase(getPopularSessionProducts.pending, state => {
        state.popularProductsLoading = true;
      })
      .addCase(getPopularSessionProducts.fulfilled, (state, action) => {
        state.popularProductsLoading = false;
        state.popularProducts = action.payload?.data?.products || [];
      })
      .addCase(getPopularSessionProducts.rejected, state => {
        state.popularProductsLoading = false;
      })
      .addCase(updateSessionProduct.fulfilled, (state, action) => {
        const updated = action.payload?.data;
        if (updated) {
          state.products = state.products.map((p: any) => p.id === updated.id ? updated : p);
        }
      });
  },
});

export default sessionSlice.reducer;
