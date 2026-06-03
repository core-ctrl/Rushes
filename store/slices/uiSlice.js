import { createSlice } from "@reduxjs/toolkit";

const initialTrailer = {
  open: false,
  key: null,
  title: "",
  id: null,
  type: "movie",
};

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    authModalOpen: false,
    authModalMode: "login",
    trailer: initialTrailer,
  },
  reducers: {
    openAuthModal: (state, action) => {
      state.authModalOpen = true;
      state.authModalMode = action.payload || "login";
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false;
    },
    openTrailer: (state, action) => {
      state.trailer = { ...initialTrailer, ...action.payload, open: true };
    },
    closeTrailer: (state) => {
      state.trailer = initialTrailer;
    },
  },
});

export const { openAuthModal, closeAuthModal, openTrailer, closeTrailer } = uiSlice.actions;
export const selectAuthModalOpen = (state) => state.ui.authModalOpen;
export const selectAuthModalMode = (state) => state.ui.authModalMode;
export const selectTrailer = (state) => state.ui.trailer;

export default uiSlice.reducer;
