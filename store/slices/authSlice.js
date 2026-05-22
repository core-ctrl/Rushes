import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/axios";

// ── Async thunks ────────────────────────────────────────────────
export const fetchCurrentUser = createAsyncThunk(
    "auth/fetchCurrentUser",
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await api.get("/api/auth/me");
            return data.user;
        } catch {
            return rejectWithValue(null);
        }
    }
);

export const loginUser = createAsyncThunk(
    "auth/login",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/api/auth/login", { email, password });
            return data.user;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || "Login failed");
        }
    }
);

export const registerUser = createAsyncThunk(
    "auth/register",
    async ({ name, username, email, password }, { rejectWithValue }) => {
        try {
            const { data } = await api.post("/api/auth/register", { name, username, email, password });
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.error || "Registration failed");
        }
    }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
    await api.post("/api/auth/logout");
    return null;
});

// ── Slice ────────────────────────────────────────────────────────
const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        isAuthenticated: false,
        status: "idle",   // idle | loading | succeeded | failed
        error: null,
        initialized: false,
    },
    reducers: {
        clearError: (state) => { state.error = null; },
        setUser: (state, action) => {
            state.user = action.payload;
            state.isAuthenticated = Boolean(action.payload);
        },
        updateUser: (state, action) => {
            if (!state.user) return;
            Object.assign(state.user, action.payload);
            state.isAuthenticated = true;
        },
    },
    extraReducers: (builder) => {
        // fetchCurrentUser
        builder
            .addCase(fetchCurrentUser.pending, (s) => { s.status = "loading"; })
            .addCase(fetchCurrentUser.fulfilled, (s, a) => {
                s.user = a.payload;
                s.isAuthenticated = !!a.payload;
                s.status = "succeeded";
                s.initialized = true;
            })
            .addCase(fetchCurrentUser.rejected, (s) => {
                s.user = null;
                s.isAuthenticated = false;
                s.status = "idle";
                s.initialized = true;
            });

        // loginUser
        builder
            .addCase(loginUser.pending, (s) => { s.status = "loading"; s.error = null; })
            .addCase(loginUser.fulfilled, (s, a) => {
                s.user = a.payload;
                s.isAuthenticated = true;
                s.status = "succeeded";
                s.initialized = true;
            })
            .addCase(loginUser.rejected, (s, a) => { s.status = "failed"; s.error = a.payload; });

        // registerUser
        builder
            .addCase(registerUser.pending, (s) => { s.status = "loading"; s.error = null; })
            .addCase(registerUser.fulfilled, (s, a) => {
                s.user = a.payload?.user || null;
                s.isAuthenticated = Boolean(a.payload?.user);
                s.status = "succeeded";
                s.initialized = true;
            })
            .addCase(registerUser.rejected, (s, a) => { s.status = "failed"; s.error = a.payload; });

        // logoutUser
        builder.addCase(logoutUser.fulfilled, (s) => {
            s.user = null;
            s.isAuthenticated = false;
            s.status = "idle";
            s.initialized = true;
        });
    },
});

export const { clearError, setUser, updateUser } = authSlice.actions;
export const selectUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
export const selectInitialized = (state) => state.auth.initialized;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export default authSlice.reducer;
