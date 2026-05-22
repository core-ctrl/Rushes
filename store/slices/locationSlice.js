import { createSlice } from '@reduxjs/toolkit';

const locationSlice = createSlice({
    name: 'location',
    initialState: { data: null },
    reducers: {
        setLocation: (state, action) => {
            state.data = action.payload;
        },
        clearLocation: (state) => {
            state.data = null;
        },
    },
});

export const { setLocation, clearLocation } = locationSlice.actions;
export const selectLocation = (state) => state.location.data;
export default locationSlice.reducer;
