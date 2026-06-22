import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeCall: null, // { roomID, mode, otherUser, currentUser, conversationId }
  activeWatchParty: null, // { roomID, movieTitle, streamingUrl }
  isCallMinimized: false,
  isWatchPartyMinimized: false,
  callerStatus: 'idle', // 'idle' | 'calling' | 'accepted' | 'declined'
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall(state, action) {
      if (state.activeCall?.roomID === action.payload.roomID) {
        state.activeCall = { ...state.activeCall, ...action.payload };
        return;
      }
      state.activeCall = action.payload;
      state.isCallMinimized = false;
      state.callerStatus = 'calling';
    },
    endCall(state) {
      state.activeCall = null;
      state.isCallMinimized = false;
      state.callerStatus = 'idle';
    },
    cancelCall(state) {
      state.activeCall = null;
      state.isCallMinimized = false;
      state.callerStatus = 'idle';
    },
    setCallerStatus(state, action) {
      state.callerStatus = action.payload; // 'calling' | 'accepted' | 'declined'
    },
    minimizeCall(state) {
      state.isCallMinimized = true;
    },
    maximizeCall(state) {
      state.isCallMinimized = false;
    },
    startWatchParty(state, action) {
      if (state.activeWatchParty?.roomID === action.payload.roomID) {
        state.activeWatchParty = { ...state.activeWatchParty, ...action.payload };
        return;
      }
      state.activeWatchParty = action.payload;
      state.isWatchPartyMinimized = false;
    },
    endWatchParty(state) {
      state.activeWatchParty = null;
      state.isWatchPartyMinimized = false;
    },
    minimizeWatchParty(state) {
      state.isWatchPartyMinimized = true;
    },
    maximizeWatchParty(state) {
      state.isWatchPartyMinimized = false;
    },
  },
});

export const {
  startCall,
  endCall,
  cancelCall,
  setCallerStatus,
  minimizeCall,
  maximizeCall,
  startWatchParty,
  endWatchParty,
  minimizeWatchParty,
  maximizeWatchParty,
} = callSlice.actions;

export const selectActiveCall = (state) => state.call.activeCall;
export const selectIsCallMinimized = (state) => state.call.isCallMinimized;
export const selectActiveWatchParty = (state) => state.call.activeWatchParty;
export const selectIsWatchPartyMinimized = (state) => state.call.isWatchPartyMinimized;
export const selectCallerStatus = (state) => state.call.callerStatus;

export default callSlice.reducer;
