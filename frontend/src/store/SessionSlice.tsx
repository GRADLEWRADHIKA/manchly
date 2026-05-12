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
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'bottom'});
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
      Toast.show({type: 'success', text1: 'Registered as session expert!', position: 'bottom'});
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'bottom'});
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

// Session Products
export const createSessionProduct = createAsyncThunk(
  'session/createProduct',
  async (data: {title: string; description?: string; duration: number; price: number; mode: string}) => {
    try {
      const response = await instance.post('sessions/products', data);
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'bottom'});
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

export const bookSession = createAsyncThunk(
  'session/book',
  async (data: {product_id: string}) => {
    try {
      const response = await instance.post('sessions/book', data);
      return response.data;
    } catch (error: any) {
      const msg = JSON.parse(error?.request?._response || '{}');
      Toast.show({type: 'error', text1: 'Error', text2: msg?.error, position: 'bottom'});
      throw error;
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
    expertProfile: null as any,
    experts: [] as any[],
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
      });
  },
});

export default sessionSlice.reducer;
