
// import { File } from "@/types/file"
import { File } from "@/model/file.model"
import { FilesState, ReduxFile } from "@/types/state.type"
import { Draft, PayloadAction, createSlice } from "@reduxjs/toolkit"



const initialState: FilesState = {
    byId: {},
    allIds: [],
    currentFile: null,
    loading: false,
    error: null,
}

const fileSlice = createSlice({
    name: "file",
    initialState,
    reducers: {
        ADD_FILE: (state, action: PayloadAction<ReduxFile>) => {
            state.byId[action.payload._id] = action.payload;
            state.allIds.push(action.payload._id);
        },
        DELETE_FILE: (state, action: PayloadAction<string>) => {
                    const idToDelete = action.payload;
        
                    // Remove from byId dictionary
                    delete state.byId[idToDelete];
        
                    // Remove from allIds array (immutable update)
                    state.allIds = state.allIds.filter((id: string) => id !== idToDelete); // Explicitly typed 'id' here
        
                    // If the deleted workspace was the current one, clear currentWorkspace
                    if (state.currentFile === idToDelete) {
                        state.currentFile = null;
                    }
                },
        UPDATE_FILE: (state, action: PayloadAction<{ id: string; updates: Partial<ReduxFile>;}>) => {
            const { id, updates } = action.payload;
                        if(id && state.byId[id]){
                            state.byId[id] = {
                                ...state.byId[id],
                                ...updates,
                            } 
                        }
        },
        SET_FILES: (state, action: PayloadAction<ReduxFile[]>) => {
            state.byId = {};
            state.allIds = [];
            action.payload.forEach(f => {
                state.byId[f._id] = f;
                state.allIds.push(f._id);
            });
            state.loading = false;
        },
        SET_CURRENT_FILE: (state, action: PayloadAction<string | null>) => {
            state.currentFile = action.payload;
        },
         SET_FILE_LOADING: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        SET_FILE_ERROR: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    }
})

export const {
    ADD_FILE,
    DELETE_FILE,
    UPDATE_FILE,
    SET_FILES,
    SET_CURRENT_FILE,
     SET_FILE_LOADING,
    SET_FILE_ERROR,
} = fileSlice.actions

export default fileSlice.reducer;
