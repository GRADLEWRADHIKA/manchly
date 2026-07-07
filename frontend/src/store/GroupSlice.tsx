import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import {instance} from '../utils/AxiosInstance';

export const getMyGroups = createAsyncThunk('group/getMyGroups', async (_, {rejectWithValue}) => {
  try {
    const res = await instance.get('groups');
    return res.data?.data;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message || 'Failed');
  }
});

export const createGroup = createAsyncThunk('group/create', async (data: {name: string; description?: string}, {rejectWithValue}) => {
  try {
    const res = await instance.post('groups', data);
    Toast.show({type: 'success', text1: 'Group created!', position: 'bottom'});
    return res.data?.data;
  } catch (e: any) {
    Toast.show({type: 'error', text1: e?.response?.data?.message || 'Failed', position: 'bottom'});
    return rejectWithValue(e?.response?.data?.message);
  }
});

export const getGroupDetails = createAsyncThunk('group/getDetails', async (groupId: string, {rejectWithValue}) => {
  try {
    const res = await instance.get(`groups/${groupId}`);
    return res.data?.data;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message);
  }
});

export const updateGroup = createAsyncThunk('group/update', async ({groupId, data}: {groupId: string; data: any}, {rejectWithValue}) => {
  try {
    const res = await instance.put(`groups/${groupId}`, data);
    Toast.show({type: 'success', text1: 'Group updated', position: 'bottom'});
    return res.data?.data;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message);
  }
});

export const deleteGroup = createAsyncThunk('group/delete', async (groupId: string, {rejectWithValue}) => {
  try {
    await instance.delete(`groups/${groupId}`);
    Toast.show({type: 'success', text1: 'Group deleted', position: 'bottom'});
    return groupId;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message);
  }
});

export const addGroupMembers = createAsyncThunk('group/addMembers', async ({groupId, memberIds}: {groupId: string; memberIds: string[]}, {rejectWithValue}) => {
  try {
    const res = await instance.post(`groups/${groupId}/members`, {member_ids: memberIds});
    Toast.show({type: 'success', text1: 'Members added', position: 'bottom'});
    return res.data?.data;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message);
  }
});

export const removeGroupMember = createAsyncThunk('group/removeMember', async ({groupId, memberId}: {groupId: string; memberId: string}, {rejectWithValue}) => {
  try {
    await instance.delete(`groups/${groupId}/members/${memberId}`);
    return {groupId, memberId};
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message);
  }
});

export const updateMemberRole = createAsyncThunk('group/updateRole', async ({groupId, memberId, role}: {groupId: string; memberId: string; role: string}, {rejectWithValue}) => {
  try {
    const res = await instance.put(`groups/${groupId}/members/${memberId}/role`, {role});
    return res.data?.data;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message);
  }
});

export const leaveGroup = createAsyncThunk('group/leave', async (groupId: string, {rejectWithValue}) => {
  try {
    await instance.post(`groups/${groupId}/leave`);
    Toast.show({type: 'success', text1: 'Left group', position: 'bottom'});
    return groupId;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message);
  }
});

const groupSlice = createSlice({
  name: 'group',
  initialState: {
    groups: [] as any[],
    currentGroup: null as any,
    loading: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getMyGroups.pending, state => { state.loading = true; })
      .addCase(getMyGroups.fulfilled, (state, action) => {
        state.groups = action.payload || [];
        state.loading = false;
      })
      .addCase(getMyGroups.rejected, state => { state.loading = false; })
      .addCase(createGroup.fulfilled, (state, action) => {
        if (action.payload) state.groups.unshift(action.payload);
      })
      .addCase(getGroupDetails.fulfilled, (state, action) => {
        state.currentGroup = action.payload;
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          state.groups = state.groups.map(g => g.id === updated.id ? updated : g);
          if (state.currentGroup?.id === updated.id) state.currentGroup = updated;
        }
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g.id !== action.payload);
      })
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.groups = state.groups.filter(g => g.id !== action.payload);
      });
  },
});

export default groupSlice.reducer;
