import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeCall: null, // { roomID, mode, otherUser }
  activeWatchParty: null, // { roomID, movieTitle, streamingUrl }
  isCallMinimized: false,
  isWatchPartyMinimized: false,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall(state, action) {
      state.activeCall = action.payload;
      state.isCallMinimized = false;
    },
    endCall(state) {
      state.activeCall = null;
      state.isCallMinimized = false;
    },
    minimizeCall(state) {
      state.isCallMinimized = true;
    },
    maximizeCall(state) {
      state.isCallMinimized = false;
    },
    startWatchParty(state, action) {
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

export default callSlice.reducer;
