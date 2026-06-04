
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

export const fetchWatchlist = createAsyncThunk(
    "watchlist/fetch",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/api/user/list");
            return (data.list || []).map((i) => ({ ...i, id: i.mediaId }));
        } catch {
            return rejectWithValue([]);
        }
    }
);

export const toggleWatchlist = createAsyncThunk(
    "watchlist/toggle",
    async (movie, { getState, rejectWithValue }) => {
        const { watchlist } = getState();
        const inList = watchlist.items.some((m) => m.id === movie.id);
        try {
            if (inList) {
                await api.delete("/api/user/list", {
                    params: { mediaId: movie.id, mediaType: movie.media_type || "movie" },
                });
            } else {
                await api.post("/api/user/list", {
                    mediaId: movie.id,
                    mediaType: movie.media_type || (movie.title ? "movie" : "tv"),
                    title: movie.title || movie.name,
                    posterPath: movie.poster_path,
                });
            }
            return { movie, inList };
        } catch (err) {
            return rejectWithValue(err.message);
        }
    }
);

// Guest watchlist handled via slice actions

const watchlistSlice = createSlice({
    name: "watchlist",
    initialState: { items: [], status: "idle" },
    reducers: {
        setWatchlist: (state, action) => { state.items = action.payload; },
        clearWatchlist: (state) => { state.items = []; },
        toggleGuest: (state, action) => {
            const movie = action.payload;
            const exists = state.items.some((m) => m.id === movie.id);
            if (exists) {
                state.items = state.items.filter((m) => m.id !== movie.id);
            } else {
                const minMovie = {
                    id: movie.id,
                    media_type: movie.media_type || (movie.title ? "movie" : "tv"),
                    title: movie.title || movie.name,
                    poster_path: movie.poster_path,
                    vote_average: movie.vote_average,
                    release_date: movie.release_date,
                    first_air_date: movie.first_air_date
                };
                state.items = [...state.items, minMovie];
            }
            // Persist to localStorage
            try { localStorage.setItem("watchlist", JSON.stringify(state.items)); } catch (err) { console.error("localStorage error:", err); }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWatchlist.fulfilled, (s, a) => { s.items = a.payload; s.status = "succeeded"; })
            .addCase(toggleWatchlist.fulfilled, (s, a) => {
                const { movie, inList } = a.payload;
                if (inList) {
                    s.items = s.items.filter((m) => m.id !== movie.id);
                } else {
                    const minMovie = {
                        id: movie.id,
                        media_type: movie.media_type || (movie.title ? "movie" : "tv"),
                        title: movie.title || movie.name,
                        poster_path: movie.poster_path,
                        vote_average: movie.vote_average,
                        release_date: movie.release_date,
                        first_air_date: movie.first_air_date
                    };
                    s.items = [...s.items, minMovie];
                }
            });
    },
});

export const { setWatchlist, clearWatchlist, toggleGuest: toggleGuestWatchlist } = watchlistSlice.actions;
export const selectWatchlist = (s) => s.watchlist.items;
export const selectInWatchlist = (id) => (s) => s.watchlist.items.some((m) => m.id === id);
export default watchlistSlice.reducer;
