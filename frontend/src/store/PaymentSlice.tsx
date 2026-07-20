import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

// Create Payment Order
export const createPaymentOrder = createAsyncThunk(
  'payment/createOrder',
  async (courseId: string, { rejectWithValue }) => {
    try {
      const res = await instance.post(`payments/create-order/${courseId}`);

      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to create payment order';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  }
);

// Verify Payment
export const verifyPayment = createAsyncThunk(
  'payment/verify',
  async (
    paymentData: {
      order_id: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await instance.post('payments/verify', paymentData);
      Toast.show({
        type: 'success',
        text1: 'Payment successful! Enjoy your course.',
        position: 'top',
      });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Payment verification failed';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  }
);

// Get My Transactions
export const getMyTransactions = createAsyncThunk(
  'payment/myTransactions',
  async (
    params: { page?: number; limit?: number; status?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));
      if (params.status) queryParams.append('status', params.status);

      const url = queryParams.toString()
        ? `payments/my-transactions?${queryParams.toString()}`
        : 'payments/my-transactions';

      const res = await instance.get(url);
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to fetch transactions';
      return rejectWithValue(msg);
    }
  }
);

// Get Creator Sales (for creators)
export const getCreatorSales = createAsyncThunk(
  'payment/creatorSales',
  async (
    params: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', String(params.page));
      if (params.limit) queryParams.append('limit', String(params.limit));

      const url = queryParams.toString()
        ? `payments/creator-sales?${queryParams.toString()}`
        : 'payments/creator-sales';

      const res = await instance.get(url);
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to fetch sales';
      return rejectWithValue(msg);
    }
  }
);

const slice = createSlice({
  name: 'payment',
  initialState: {
    loading: false,
    orderData: null as any,
    transactions: [] as any[],
    sales: [] as any[],
    totalRevenue: 0,
    pagination: null as any,
  },
  reducers: {
    clearOrderData: state => {
      state.orderData = null;
    },
  },
  extraReducers: builder => {
    builder
      // Create Payment Order
      .addCase(createPaymentOrder.pending, state => {
        state.loading = true;
      })
      .addCase(createPaymentOrder.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.orderData = payload;
      })
      .addCase(createPaymentOrder.rejected, state => {
        state.loading = false;
      })
      // Verify Payment
      .addCase(verifyPayment.pending, state => {
        state.loading = true;
      })
      .addCase(verifyPayment.fulfilled, state => {
        state.loading = false;
        state.orderData = null;
      })
      .addCase(verifyPayment.rejected, state => {
        state.loading = false;
      })
      // Get My Transactions
      .addCase(getMyTransactions.fulfilled, (state, { payload }) => {
        state.transactions = payload?.transactions ?? [];
        state.pagination = payload?.pagination ?? null;
      })
      // Get Creator Sales
      .addCase(getCreatorSales.fulfilled, (state, { payload }) => {
        state.sales = payload?.transactions ?? [];
        state.totalRevenue = payload?.total_revenue ?? 0;
        state.pagination = payload?.pagination ?? null;
      });
  },
});

export const { clearOrderData } = slice.actions;
export default slice.reducer;

