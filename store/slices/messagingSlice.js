import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchConversations = createAsyncThunk(
    'messaging/fetchConversations',
    async (_, { getState }) => {
        const token = getState().auth.token;
        const res = await fetch('/api/messages/conversations', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    }
);

const messagingSlice = createSlice({
    name: 'messaging',
    initialState: {
        conversations: [],
        currentConversation: null,
        messages: {},
        isLoading: false,
        unreadCount: 0
    },
    reducers: {
        setCurrentConversation: (state, action) => {
            state.currentConversation = action.payload;
        },
        addMessage: (state, action) => {
            const { conversationId } = action.payload;
            if (!state.messages[conversationId]) state.messages[conversationId] = [];
            state.messages[conversationId].push(action.payload);
        },
        setMessages: (state, action) => {
            state.messages[action.payload.conversationId] = action.payload.messages;
        },
        incrementUnread: (state, action) => {
            state.unreadCount += 1;
        },
        resetUnread: (state) => {
            state.unreadCount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchConversations.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchConversations.fulfilled, (state, action) => {
                state.isLoading = false;
                state.conversations = action.payload.conversations;
            })
            .addCase(fetchConversations.rejected, (state) => {
                state.isLoading = false;
            });
    }
});

export const {
    setCurrentConversation,
    addMessage,
    setMessages,
    incrementUnread,
    resetUnread
} = messagingSlice.actions;

export default messagingSlice.reducer;
