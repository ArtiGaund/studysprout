import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { WorkSpace } from "@/model/workspace.model";
import { Draft } from 'immer';
import { ReduxWorkSpace, WorkspacesState } from "@/types/state.type";

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
        ADD_WORKSPACE: (state, action: PayloadAction<ReduxWorkSpace>) => {
            state.byId[action.payload._id] = action.payload;
            state.allIds.push(action.payload._id);
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
        UPDATE_WORKSPACE: (state, action: PayloadAction<ReduxWorkSpace>) => { // Expect full WorkSpace or Partial<WorkSpace> for consistent transfor
            // Update in byId directly
            if (state.byId[action.payload._id]) { // Check if it exists
                state.byId[action.payload._id] = action.payload;
            }
        },
        SET_WORKSPACES: (state, action: PayloadAction<ReduxWorkSpace[]>) => {
            // Clear existing state for a fresh set
            // state.byId = {};
            // state.allIds = [];
            // action.payload.forEach(ws => {
            //     state.byId[ws._id] = ws;
            //     state.allIds.push(ws._id);
            // });
            // state.loading = false; // Set loading to false after data is set
            // state.error = null;


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

