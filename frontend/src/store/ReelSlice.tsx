import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { instance } from '../utils/AxiosInstance';

// ── existing thunks unchanged ────────────────────────────────────────────────

export const getMyReels = createAsyncThunk(
  'reels/getMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await instance.get('reels/mine');
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message || 'Failed to fetch reels',
      );
    }
  },
);

export const createReelUpload = createAsyncThunk(
  'reels/createUpload',
  async (
    { courseId, caption }: { courseId: string; caption: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await instance.post(`reels/course/${courseId}`, { caption });
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to start reel upload';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

export const getReelStatus = createAsyncThunk(
  'reels/getStatus',
  async (reelId: string, { rejectWithValue }) => {
    try {
      const res = await instance.get(`reels/${reelId}/status`);
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Status check failed');
    }
  },
);

export const updateReel = createAsyncThunk(
  'reels/update',
  async (
    { reelId, body }: { reelId: string; body: { caption?: string; hidden?: boolean } },
    { rejectWithValue },
  ) => {
    try {
      const res = await instance.patch(`reels/${reelId}`, body);
      return res.data?.data;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not update the reel';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

export const deleteReel = createAsyncThunk(
  'reels/delete',
  async (reelId: string, { rejectWithValue }) => {
    try {
      const res = await instance.delete(`reels/${reelId}`);
      Toast.show({ type: 'success', text1: 'Reel deleted', position: 'top' });
      return reelId;
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not delete the reel';
      Toast.show({ type: 'error', text1: msg, position: 'top' });
      return rejectWithValue(msg);
    }
  },
);

// ── NEW: public feed thunk ───────────────────────────────────────────────────
/**
 * Fetches a page of the public reels feed.
 * `seed` should stay constant across pages of one feed session so the
 * backend's seeded-random ordering doesn't reshuffle mid-scroll — the
 * component passes the same seed it stored on first load.
 */
export const getFeedReels = createAsyncThunk(
  'reels/getFeed',
  async (
    {
      page,
      limit = 8,
      seed,
      category,
    }: { page: number; limit?: number; seed: string; category?: string },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        seed,
      });
      if (category) params.set('category', category);

      const res = await instance.get(`reels?${params.toString()}`);
      // { reels, pagination: { page, limit, total, totalPages } }
      return { ...res.data?.data, requestedPage: page };
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message || 'Failed to load reels',
      );
    }
  },
);

const makeSeed = () => Math.random().toString(36).slice(2);

const slice = createSlice({
  name: 'reels',
  initialState: {
    list: [] as any[],
    loading: false,

    // NEW: public feed state — kept separate from the creator's own `list`
    feed: [] as any[],
    feedLoading: false,
    feedPage: 0,
    feedHasMore: true,
    feedSeed: makeSeed(),
  },
  reducers: {
    // NEW: call when the user pulls-to-refresh the feed screen
    resetFeed: state => {
      state.feed = [];
      state.feedPage = 0;
      state.feedHasMore = true;
      state.feedSeed = makeSeed();
    },
    // NEW: flip is_enrolled locally after a successful enroll/purchase,
    // so every reel pointing at that course reflects it without a refetch.
    markCourseEnrolledInFeed: (state, action: { payload: string }) => {
      state.feed = state.feed.map(r =>
        r.course?.id === action.payload ? { ...r, is_enrolled: true } : r,
      );
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getMyReels.pending, state => {
        state.loading = true;
      })
      .addCase(getMyReels.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.list = payload?.reels ?? [];
      })
      .addCase(getMyReels.rejected, state => {
        state.loading = false;
      })
      .addCase(updateReel.fulfilled, (state, { payload }) => {
        if (!payload?.reel) return;
        state.list = state.list.map(r =>
          r.id === payload.reel.id ? { ...r, ...payload.reel } : r,
        );
      })
      .addCase(deleteReel.fulfilled, (state, { payload: reelId }) => {
        state.list = state.list.filter(r => r.id !== reelId);
      })

      // NEW: feed cases
      .addCase(getFeedReels.pending, state => {
        state.feedLoading = true;
      })
      .addCase(getFeedReels.fulfilled, (state, { payload }) => {
        state.feedLoading = false;
        const batch = payload?.reels ?? [];
        state.feed =
          payload.requestedPage === 1 ? batch : [...state.feed, ...batch];
        state.feedPage = payload.requestedPage;
        state.feedHasMore =
          payload.requestedPage < (payload?.pagination?.totalPages || 1);
      })
      .addCase(getFeedReels.rejected, state => {
        state.feedLoading = false;
        state.feedHasMore = false;
      });
  },
});

export const { resetFeed, markCourseEnrolledInFeed } = slice.actions;
export default slice.reducer;