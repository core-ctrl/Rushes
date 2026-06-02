
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import watchlistReducer from "./slices/watchlistSlice";
import uiReducer from "./slices/uiSlice";
import locationReducer from "./slices/locationSlice";
import messagingReducer from "./slices/messagingSlice";
import callReducer from "./slices/callSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        watchlist: watchlistReducer,
        ui: uiReducer,
        location: locationReducer,
        messaging: messagingReducer,
        call: callReducer,
    },
    middleware: (getDefault) =>
        getDefault({ serializableCheck: { ignoredPaths: ["ui.trailer"] } }),
});

export default store;
