import { Folder } from "@/model/folder.model"
import { FoldersState, ReduxFolder } from "@/types/state.type"
import { transformFolder } from "@/utils/data-transformers"
// import { Folder } from "@/types/folder"
import { Draft, PayloadAction, createSlice } from "@reduxjs/toolkit"
import mongoose from "mongoose"

const initialState: FoldersState = {
    byId: {},
    allIds: [],
    currentFolder: null,
    loading: false,
    error: null,
}

const folderSlice = createSlice({
    name: "folder",
    initialState,
    reducers: {
        ADD_FOLDER: (state, action: PayloadAction<Folder>) => {
            const transformed = transformFolder(action.payload);
            state.byId[transformed._id] = transformed;
            state.allIds.push(transformed._id);
        },
        DELETE_FOLDER: (state, action: PayloadAction<string>) => {
                    const idToDelete = action.payload;
        
                    // Remove from byId dictionary
                    delete state.byId[idToDelete];
        
                    // Remove from allIds array (immutable update)
                    state.allIds = state.allIds.filter((id: string) => id !== idToDelete); // Explicitly typed 'id' here
        
                    // If the deleted workspace was the current one, clear currentWorkspace
                    if (state.currentFolder === idToDelete) {
                        state.currentFolder = null;
                    }
                },
                UPDATE_FOLDER: ( state, action: PayloadAction<{ id: string; updates: Partial<ReduxFolder>}>) => {
                    const { id, updates } = action.payload;
                    if(id && state.byId[id]){
                        state.byId[id] = {
                            ...state.byId[id],
                            ...updates,
                        }
                        // console.log(`Redux: Folder ${id} title updated to "${state.byId[id].title}". New Object ref: `,state.byId[id]);
                    }
                },
        SET_FOLDERS: (state, action: PayloadAction<Folder[]>) => {
            state.byId = {};
            state.allIds = [];
            action.payload.forEach(f => {
                const transformed = transformFolder(f);
                state.byId[transformed._id] = transformed;
                state.allIds.push(transformed._id);
            });
            state.loading = false;
        },
         SET_CURRENT_FOLDERS: (state, action: PayloadAction<string | null>) => {
            state.currentFolder = action.payload;
        },
         SET_FOLDER_LOADING: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        SET_FOLDER_ERROR: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    }
})

export const {
    ADD_FOLDER,
    DELETE_FOLDER,
    UPDATE_FOLDER,
    SET_FOLDERS,
    SET_CURRENT_FOLDERS,
    SET_FOLDER_LOADING,
    SET_FOLDER_ERROR
} = folderSlice.actions

export default folderSlice.reducer;
