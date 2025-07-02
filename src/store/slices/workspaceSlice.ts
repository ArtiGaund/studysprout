import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { WorkSpace } from "@/model/workspace.model";
import { Draft } from 'immer';
import { WorkspacesState } from "@/types/state.type";
import { transformWorkspace } from "@/utils/data-transformers";


const initialState: WorkspacesState = {
    byId: {},
    allIds: [],
    currentWorkspace: null, // Stores the ID
    loading: false, // Add loading state
    error: null, // Add error state
}


const workspaceSlice = createSlice({
    name: "workspace",
    initialState,
    reducers: {
        ADD_WORKSPACE: (state, action: PayloadAction<WorkSpace>) => {
            const transformed = transformWorkspace(action.payload);
            // Add to byId and allIds
            state.byId[transformed._id] = transformed;
            state.allIds.push(transformed._id);
        },
        DELETE_WORKSPACE: (state, action: PayloadAction<string>) => {
            const idToDelete = action.payload;

            // Remove from byId dictionary
            delete state.byId[idToDelete];

            // Remove from allIds array (immutable update)
            state.allIds = state.allIds.filter((id: string) => id !== idToDelete); // Explicitly typed 'id' here

            // If the deleted workspace was the current one, clear currentWorkspace
            if (state.currentWorkspace === idToDelete) {
                state.currentWorkspace = null;
            }
        },
        UPDATE_WORKSPACE: (state, action: PayloadAction<WorkSpace>) => { // Expect full WorkSpace or Partial<WorkSpace> for consistent transform
            // Assuming action.payload is the *updated* WorkSpace object from API
            const transformed = transformWorkspace(action.payload);
            // Update in byId directly
            if (state.byId[transformed._id]) { // Check if it exists
                state.byId[transformed._id] = transformed;
            }
        },
        SET_WORKSPACES: (state, action: PayloadAction<WorkSpace[]>) => {
            // Clear existing state for a fresh set
            state.byId = {};
            state.allIds = [];
            action.payload.forEach(ws => {
                // Transform each incoming Mongoose WorkSpace to a ReduxWorkSpace
                const transformed = transformWorkspace(ws);
                state.byId[transformed._id] = transformed;
                state.allIds.push(transformed._id);
            });
            state.loading = false; // Set loading to false after data is set
            state.error = null;
        },
        SET_CURRENT_WORKSPACE: (state, action: PayloadAction<string | null>) => { // Payload is just the ID
            state.currentWorkspace = action.payload;
        },
         SET_WORKSPACE_LOADING: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        SET_WORKSPACE_ERROR: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    }   
})

export const {
    ADD_WORKSPACE,
    DELETE_WORKSPACE,
    UPDATE_WORKSPACE,
    SET_WORKSPACES,
    SET_CURRENT_WORKSPACE,
    SET_WORKSPACE_LOADING,
    SET_WORKSPACE_ERROR,
} = workspaceSlice.actions

export default workspaceSlice.reducer;

