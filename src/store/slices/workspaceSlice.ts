/**
 * @slice workspaceSlice
 * @description The root organizational slice for StudySprout. Manages a normalized 
 * collection of Workspaces and tracks the globally active context.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Normalized State Pattern: Uses `byId` and `allIds` to enable O(1) lookups and 
 * preserve the user's preferred workspace ordering.
 * 2. Referential Integrity: `SET_WORKSPACES` implements a manual dirty-check to prevent 
 * unnecessary re-renders of the entire sidebar if the data hasn't changed.
 * 3. Context Tracking: `SET_CURRENT_WORKSPACE` manages the "Global Active State," 
 * driving the routing and breadcrumb logic seen in other components.
 * 4. Safe Deletion: `DELETE_WORKSPACE` performs a cleanup of the `currentWorkspace` 
 * pointer to prevent "dead-link" errors in the UI.
 */
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ReduxWorkSpace, WorkspacesState } from "@/types/state.type";

const initialState: WorkspacesState = {
    byId: {},
    allIds: [],
    currentWorkspace: null, // Stores the ID
    loading: false, // Add loading state
    error: null, // Add error state
    statsStale: false,
}

const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        /**
         * @reducer ADD_WORKSPACE
         * Registers a new workspace entity into the normalized store.
         */
        ADD_WORKSPACE: (state, action: PayloadAction<ReduxWorkSpace>) => {
            state.byId[action.payload._id] = action.payload;
            state.allIds.push(action.payload._id);
        },
        /**
         * @reducer DELETE_WORKSPACE
         * Safely removes a workspace and resets the active selection if necessary.
         */
        DELETE_WORKSPACE: (state, action: PayloadAction<string>) => {
            const idToDelete = action.payload;

            // Remove from byId dictionary
            delete state.byId[idToDelete];

            // Remove from allIds array (immutable update)
            state.allIds = state.allIds.filter((id: string) => id !== idToDelete); // Explicitly typed 'id' here

            // If the deleted workspace was the current one, clear currentWorkspace
            if (state.currentWorkspace?._id === idToDelete) {
                state.currentWorkspace = null;
            }
        },

        /**
         * @slice workspaceSlice (Continued)
         * * @reducer UPDATE_WORKSPACE
         * @description Implements a targeted "Dictionary Patch." By updating only the 
         * specific key in the `byId` map, we ensure that components observing other 
         * workspaces do not trigger a re-render. This is a critical performance 
         * optimization for multi-workspace sidebars.
         */
        UPDATE_WORKSPACE: (state, action: PayloadAction<ReduxWorkSpace>) => { // Expect full WorkSpace or Partial<WorkSpace> for consistent transfor
            // Update in byId directly
            if (state.byId[action.payload._id]) { // Check if it exists
                state.byId[action.payload._id] = action.payload;
            }

            // Sync currentWorkspace 
            if(state.currentWorkspace?._id === action.payload._id){
               state.currentWorkspace = action.payload;
            }
        },
        UPDATE_WORKSPACE_PARTIAL: (
            state,
            action: PayloadAction<{
                id: string,
                updates: Partial<ReduxWorkSpace>
            }>
        ) => {
            const { id, updates } = action.payload;

            if(state.byId[id]){
                state.byId[id] = { ...state.byId[id], ...updates };
            }
            if(state.currentWorkspace?._id === id){
                state.currentWorkspace = {
                    ...state.currentWorkspace,
                    ...updates,
                };
            }
        },

        /**
         * @reducer SET_WORKSPACES
         * Performs an "Optimized Hydration." By comparing new data against existing keys 
         * and content, it prevents Redux from emitting a change event if the incoming 
         * data is identical to the current state.
         */
        SET_WORKSPACES: (state, action: PayloadAction<ReduxWorkSpace[]>) => {
            // Create a new dictionaries and arrays from the payload
            const newByID: { [ key: string]: ReduxWorkSpace } = {};
            const newAllIds: string[] = [];
            action.payload.forEach(workspace => {
                newByID[workspace._id] = workspace;
                newAllIds.push(workspace._id);
            })

            // Compare existing state with the new state
            const currentByIdKeys = Object.keys(state.byId);
            const newByIdKeys = Object.keys(newByID);

            // Check for changes in the keys or content before updating
            if(newByIdKeys.length !== currentByIdKeys.length || 
                newByIdKeys.some( key => JSON.stringify(state.byId[key]) !== JSON.stringify(newByID[key]))){
                    state.byId = newByID;
                    state.allIds = newAllIds;
                    state.loading = false;
                    state.error = null;
                }

                // If no changes, do nothing. Immer will prevent a state change.
                // But we should still set loading/error states in case of empty data.
                state.loading = false;
                state.error = null;
        },

        /**
         * @reducer SET_CURRENT_WORKSPACE
         * @description Manages the "Active Context." This state drives the conditional 
         * rendering of the entire Dashboard. When a user clicks a workspace in the 
         * sidebar, this action synchronizes the URL parameters with the Redux state 
         * to ensure a "Single Source of Truth."
         */
        SET_CURRENT_WORKSPACE: (state, action: PayloadAction<ReduxWorkSpace | null>) => { // Payload is just the ID
            state.currentWorkspace = action.payload;
        },

        /**
         * @reducer SET_WORKSPACE_LOADING
         * @description Orchestrates "Global Loading States." This is utilized by 
         * high-level Layout components to render skeleton screens or progress bars 
         * during initial hydration or heavy API transitions.
         */
         SET_WORKSPACE_LOADING: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },

        /**
         * @reducer SET_WORKSPACE_ERROR
         * @description A centralized error sink. Captured API failures are stored 
         * here to be consumed by global Toast providers or Error Boundary components, 
         * ensuring a graceful "Fail-Soft" user experience.
         */
        SET_WORKSPACE_ERROR: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        MARK_STATS_STALE:(state) => {
            state.statsStale = true;
        },
        MARK_STATS_FRESH:(state) => {
            state.statsStale = false;
        }
    }   
})

export const {
    ADD_WORKSPACE,
    DELETE_WORKSPACE,
    UPDATE_WORKSPACE,
    UPDATE_WORKSPACE_PARTIAL,
    SET_WORKSPACES,
    SET_CURRENT_WORKSPACE,
    SET_WORKSPACE_LOADING,
    SET_WORKSPACE_ERROR,
    MARK_STATS_FRESH,
    MARK_STATS_STALE,
} = workspaceSlice.actions

export default workspaceSlice.reducer;

