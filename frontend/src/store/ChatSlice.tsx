import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import {instance} from '../utils/AxiosInstance';

// Create or get a conversation with another user
export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (participantId: string, {rejectWithValue}) => {
    try {
      const res = await instance.post('chat/conversations', {participant_id: participantId});
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to create conversation');
    }
  },
);

// Get all conversations for current user
export const getConversations = createAsyncThunk(
  'chat/getConversations',
  async (_, {rejectWithValue}) => {
    try {
      const res = await instance.get('chat/conversations');
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch conversations');
    }
  },
);

// Get messages for a conversation
export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (conversationId: string, {rejectWithValue}) => {
    try {
      const res = await instance.get(`chat/conversations/${conversationId}/messages`);
      return {conversationId, messages: res.data?.data || []};
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to fetch messages');
    }
  },
);

// Send a message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (data: {conversationId: string; content: string; type?: string}, {rejectWithValue}) => {
    try {
      const res = await instance.post('chat/messages', data);
      return res.data?.data;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to send message');
    }
  },
);

// Mark messages as read
export const markMessagesRead = createAsyncThunk(
  'chat/markRead',
  async (conversationId: string, {rejectWithValue}) => {
    try {
      await instance.put('chat/messages/read', {conversationId});
      return conversationId;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed');
    }
  },
);

// Delete a message
export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: string, {rejectWithValue}) => {
    try {
      await instance.delete(`chat/messages/${messageId}`);
      return messageId;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message || 'Failed to delete');
    }
  },
);

interface ChatState {
  conversations: any[];
  messages: Record<string, any[]>;
  loading: boolean;
  messagesLoading: boolean;
}

const initialState: ChatState = {
  conversations: [],
  messages: {},
  loading: false,
  messagesLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addSocketMessage: (state, action) => {
      const msg = action.payload;
      const convId = msg.conversationId || msg.conversation_id;
      if (convId && state.messages[convId]) {
        const exists = state.messages[convId].some((m: any) => m.id === msg.id);
        if (!exists) {
          state.messages[convId].push(msg);
        }
      }
      // Update last message in conversation list
      const conv = state.conversations.find((c: any) => c.id === convId);
      if (conv) {
        conv.last_message = msg.content;
        conv.last_message_at = msg.created_at || new Date().toISOString();
      }
    },
    markConversationRead: (state, action) => {
      const convId = action.payload;
      const conv = state.conversations.find((c: any) => c.id === convId);
      if (conv) {
        conv.unread_count = 0;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getConversations.pending, state => {
        state.loading = true;
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.conversations = action.payload || [];
        state.loading = false;
      })
      .addCase(getConversations.rejected, state => {
        state.loading = false;
      })
      .addCase(getMessages.pending, state => {
        state.messagesLoading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        const {conversationId, messages} = action.payload;
        state.messages[conversationId] = messages;
        state.messagesLoading = false;
      })
      .addCase(getMessages.rejected, state => {
        state.messagesLoading = false;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        const convId = msg?.conversationId || msg?.conversation_id;
        if (convId && state.messages[convId]) {
          state.messages[convId].push(msg);
        }
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const msgId = action.payload;
        for (const convId in state.messages) {
          state.messages[convId] = state.messages[convId].filter((m: any) => m.id !== msgId);
        }
      });
  },
});

export const {addSocketMessage, markConversationRead} = chatSlice.actions;
export default chatSlice.reducer;
