import { ActivityEvent, ActivityPagination } from "@/components/workspace-view/acitivity-feed";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ActivityState{
    events: ActivityEvent[];
    pagination: ActivityPagination | null;
    loading: boolean;
    error: string | null;
    activityStale: boolean;
}

const initialState: ActivityState = {
    events: [],
    pagination: null,
    loading: false,
    error: null,
    activityStale: false,
}

const activitySlice = createSlice({
    name: "activity",
    initialState,
    reducers: {
        /**
         * @reducer SET_ACTIVITY_EVENTS
         * Full replacement - used on initial load or workspace switch
         */
        SET_ACTIVITY_EVENTS:(
            state,
            action: PayloadAction<{
                events: ActivityEvent[];
                pagination: ActivityPagination;
            }>
        ) => {
            state.events = action.payload.events;
            state.pagination = action.payload.pagination;
        },
        /**
         * @reducer APPEND_ACTIVITY_EVENTS
         * Used for pagination - "load more" appends to existing list.
         */
        APPEND_ACTIVITY_EVENTS:(
            state,
            action: PayloadAction<{
                events: ActivityEvent[];
                pagination: ActivityPagination;
            }>
        ) => {
            state.events = [ ...state.events, ...action.payload.events ];
            state.pagination = action.payload.pagination;
        },
        /**
         * @reducer PREPEND_ACTIVITY_EVENT
         * Real-time prepend when socket fires activity_created
         */
        PREPEND_ACTIVITY_EVENT:(
            state,
            action: PayloadAction<ActivityEvent>
        ) => {
            const exists = state.events.some(e => e._id === action.payload._id);
            if(!exists){
                state.events = [ action.payload, ...state.events].slice(0, 50);
            }
        },
        /**
         * @reducer SET_ACTIVITY_LOADING
         */
        SET_ACTIVITY_LOADING: (
            state,
            action: PayloadAction<boolean>
        ) => {
            state.loading = action.payload;
        },
        /**
         * @reducer SET_ACTIVITY_ERROR
         */
        SET_ACTIVITY_ERROR: (
            state,
            action: PayloadAction<string | null>
        ) => {
            state.error = action.payload;
        },
        /**
         * @reducer CLEAR_ACTIVITY
         * Called on workspace switch to prevent stale feed from flashing
         */
        CLEAR_ACTIVITY: (
            state
        ) => {
            state.events = [];
            state.pagination = null;
            state.error = null;
        },
        MARK_ACTIVITY_STALE: (state) => {
            state.activityStale = true;
        },
        MARK_ACTIVITY_FRESH: (state) => {
            state.activityStale = false;
        },
    }
});

export const {
    SET_ACTIVITY_EVENTS,
    APPEND_ACTIVITY_EVENTS,
    PREPEND_ACTIVITY_EVENT,
    SET_ACTIVITY_LOADING,
    SET_ACTIVITY_ERROR,
    CLEAR_ACTIVITY,
    MARK_ACTIVITY_STALE,
    MARK_ACTIVITY_FRESH,
} = activitySlice.actions;

export default activitySlice.reducer;