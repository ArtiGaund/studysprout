
// import { File } from "@/types/file"
import { File } from "@/model/file.model"
import { FilesState, ReduxFile } from "@/types/state.type"
import { transformFile } from "@/utils/data-transformers"
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
        ADD_FILE: (state, action: PayloadAction<File>) => {
            const transformed = transformFile(action.payload);
            state.byId[transformed._id] = transformed;
            state.allIds.push(transformed._id);
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
        UPDATE_FILE: (state, action: PayloadAction<File>) => {
            // const { _id, ...update } = action.payload;
            //             if(_id && state.byId[_id]){
            //                 state.byId[_id] = {
            //                     ...state.byId[_id],
            //                     ...update,
            //                 } as ReduxFile;
            //             }
            const updatedMongooseFile = action.payload;
            const transformedReduxFile = transformFile(updatedMongooseFile);
            
            if(transformedReduxFile._id && state.byId[transformedReduxFile._id]){
                state.byId[transformedReduxFile._id] = {
                    ...state.byId[transformedReduxFile._id],
                    ...transformedReduxFile,
                };
            }
        },
        SET_FILES: (state, action: PayloadAction<File[]>) => {
            state.byId = {};
            state.allIds = [];
            action.payload.forEach(f => {
                const transformed = transformFile(f);
                state.byId[transformed._id] = transformed;
                state.allIds.push(transformed._id);
            });
            state.loading = false;
        },
        SET_CURRENT_FILES: (state, action: PayloadAction<string | null>) => {
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
    SET_CURRENT_FILES,
     SET_FILE_LOADING,
    SET_FILE_ERROR,
} = fileSlice.actions

export default fileSlice.reducer;
