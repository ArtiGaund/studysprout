
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
            const file = action.payload;
            if (!state.byId[file._id]) {
                state.allIds.push(file._id);
            }
            state.byId[file._id] = file;
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
            const file = state.byId[id];
            if(!file) return;

            // Prevent accidental overwrites of blocks / blockorder
            const { blocks, blockOrder, ...metadataUpdates } = updates;

            state.byId[id] = {
                ...file,
                ...metadataUpdates,
                blocks: file.blocks,
                blockOrder: file.blockOrder,
            };
        },
        SET_FILES: (state, action: PayloadAction<ReduxFile[]>) => {
            const newIncomingIds = new Set(action.payload.map(file => file._id));
            let updatedAllIds = [ ...state.allIds ];
            let updatedByIds = { ...state.byId };

            // add/update incoming files
            action.payload.forEach(file => {
                if(!updatedByIds[file._id]){
                    updatedAllIds.push(file._id);
                }
                updatedByIds[file._id] = file;
            });

            state.byId = updatedByIds;
            state.allIds = updatedAllIds;
            state.loading = false;
            state.error = null;
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
        ADD_BlOCK: (state, action) => {
            const { fileId, block, afterBlockId } = action.payload;
            const file = state.byId[fileId];
            if(!file) return;

            file.blocks[block.id] = block;

            if(!afterBlockId){
                file.blockOrder.push(block.id);
            }else{
                const index = file.blockOrder.indexOf(afterBlockId);
                file.blockOrder.splice(index + 1, 0, block.id);
            }
        },
        UPDATE_BLOCK: (state, action) => {
            const { fileId, blockId, updates } = action.payload;
            const file = state.byId[fileId];
            if(!file) return;

            file.blocks[blockId] = {
                ...file.blocks[blockId],
                ...updates
            };
        },
        DELETE_BLOCK: (state, action) => {
            const { fileId, blockId } = action.payload;
            const file = state.byId[fileId];
            if(!file) return;

            delete file.blocks[blockId];
            file.blockOrder = file.blockOrder.filter(id => id!== blockId);
        }
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
    ADD_BlOCK,
    UPDATE_BLOCK,
    DELETE_BLOCK,
} = fileSlice.actions

export default fileSlice.reducer;
