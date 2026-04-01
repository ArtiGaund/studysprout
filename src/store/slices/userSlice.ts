/**
 * @slice userSlice
 * @description Manages the global authentication state and user identity within the application.
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. Session Orchestration: Tracks 'status' (loading | authenticated | unauthenticated) 
 * to drive conditional rendering of protected routes and layouts.
 * 2. Identity Scoping: Stores the `userId`, which serves as the primary key for 
 * scoping all Workspace, Folder, and File retrievals in the service layer.
 * 3. Token Persistence: Maintains the JWT/Auth token in memory for inclusion in 
 * secure API requests via Axios interceptors or specialized services.
 * 4. State Hygiene: Provides a `CLEAR_USER` action to sanitize the Redux store 
 * during logout, preventing unauthorized data access in shared environments.
 */
import { ReduxUserState } from "@/types/state.type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: ReduxUserState = {
    userId: null,
    status: "loading",
    token: null,
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        /**
         * @reducer SET_AUTH_LOADING
         * Used during the initial mount or session refresh to prevent 
         * "Layout Shift" by allowing the UI to render a loading skeleton.
         */
        SET_AUTH_LOADING:(state) => {
            state.status = "loading";
        },

        /**
         * @reducer SET_USER
         * Hydrates the user state upon successful login or session validation. 
         * Synchronizes the backend user object with the frontend Redux store.
         */
        SET_USER: (
            state,
            action: PayloadAction<ReduxUserState>
        ) => {
            state.userId = action.payload.userId;
            state.status = action.payload.status;
            state.token = action.payload.token ?? null;
        },
        /**
         * @reducer CLEAR_USER
         * Resets the identity slice. Typically called in conjunction with 
         * `RESET_FOLDERS_STATE` and `RESET_FILES` for a complete application reset.
         */
        CLEAR_USER:(state) => {
            state.userId = null;
            state.status = "unauthenticated";
            state.token = null;
        },
    },
});

export const {
    SET_AUTH_LOADING,
    SET_USER,
    CLEAR_USER,
} = userSlice.actions;

export default userSlice.reducer;