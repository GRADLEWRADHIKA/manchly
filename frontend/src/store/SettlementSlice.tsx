import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

// KYC Status
export const getKycStatus = createAsyncThunk('settlement/getKycStatus', async () => {
  const res = await instance.get('kyc/status');
  return res.data?.data;
});

// Verify PAN
export const verifyPan = createAsyncThunk('settlement/verifyPan', async (data: { pan_number: string }) => {
  const res = await instance.post('kyc/verify-pan', data);
  return res.data?.data;
});

// Complete KYC Verification
export const verifyKycComplete = createAsyncThunk('settlement/verifyKycComplete', async (data: { pan_number: string; name: string; dob: string }) => {
  const res = await instance.post('kyc/verify', data);
  return res.data?.data;
});

// Verify Bank Account
export const verifyBankAccount = createAsyncThunk('settlement/verifyBankAccount', async (data: { account_number: string; ifsc: string }) => {
  const res = await instance.post('kyc/verify-bank', data);
  return res.data?.data;
});

// Reset KYC
export const resetKyc = createAsyncThunk('settlement/resetKyc', async () => {
  const res = await instance.post('kyc/reset');
  return res.data?.data;
});

// Get Wallet
export const getWallet = createAsyncThunk('settlement/getWallet', async () => {
  const res = await instance.get('settlements/wallet');
  return res.data?.data;
});

// Add Bank Account
export const addBankAccount = createAsyncThunk('settlement/addBankAccount', async (data: { account_holder: string; account_number: string; ifsc: string; bank_name: string }) => {
  const res = await instance.post('settlements/bank-account', data);
  Toast.show({ type: 'success', text1: 'Bank account added successfully!' });
  return res.data?.data;
});

// Get Bank Account
export const getBankAccount = createAsyncThunk('settlement/getBankAccount', async () => {
  const res = await instance.get('settlements/bank-account');
  return res.data?.data;
});

// Get Earnings Breakdown
export const getEarningsBreakdown = createAsyncThunk('settlement/getEarningsBreakdown', async () => {
  const res = await instance.get('settlements/earnings-breakdown');
  return res.data?.data;
});

// Get Settlement History
export const getSettlementHistory = createAsyncThunk(
  'settlement/getHistory',
  async (params: {page?: number; limit?: number} = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append('page', String(params.page));
      if (params.limit) query.append('limit', String(params.limit));
      const res = await instance.get(`settlements/my-settlements?${query.toString()}`);
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch settlements');
    }
  },
);

// Get Settlement Detail
export const getSettlementDetail = createAsyncThunk(
  'settlement/getDetail',
  async (settlementId: string, { rejectWithValue }) => {
    try {
      const res = await instance.get(`settlements/${settlementId}`);
      return res.data?.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || 'Failed to fetch settlement detail');
    }
  },
);

// Request Withdrawal
export const requestWithdrawal = createAsyncThunk('settlement/withdraw', async (amount: number, { rejectWithValue }) => {
  try {
    const res = await instance.post('settlements/withdraw', { amount });
    Toast.show({ type: 'success', text1: 'Withdrawal request submitted successfully!' });
    return res.data?.data;
  } catch (error: any) {
    const msg = error?.response?.data?.message || 'Failed to submit withdrawal request';
    Toast.show({ type: 'error', text1: msg });
    return rejectWithValue(msg);
  }
});

const slice = createSlice({
  name: 'settlement',
  initialState: {
    kycStatus: null as any,
    wallet: null as any,
    bankAccount: null as any,
    earningsBreakdown: null as any,
    settlements: [] as any[],
    settlementDetail: null as any,
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getKycStatus.fulfilled, (state, { payload }) => {
        state.kycStatus = payload;
      })
      .addCase(getWallet.fulfilled, (state, { payload }) => {
        state.wallet = payload;
      })
      .addCase(getBankAccount.fulfilled, (state, { payload }) => {
        state.bankAccount = payload;
      })
      .addCase(getEarningsBreakdown.fulfilled, (state, { payload }) => {
        state.earningsBreakdown = payload;
      })
      .addCase(getSettlementHistory.pending, state => {
        state.loading = true;
      })
      .addCase(getSettlementHistory.fulfilled, (state, { payload }) => {
        state.settlements = payload || [];
        state.loading = false;
      })
      .addCase(getSettlementHistory.rejected, state => {
        state.loading = false;
      })
      .addCase(getSettlementDetail.fulfilled, (state, { payload }) => {
        state.settlementDetail = payload;
      });
  },
});

export default slice.reducer;
