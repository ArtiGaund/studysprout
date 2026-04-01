/**
 * @slice fileSlice
 * @description Manages the normalized state of Files and their constituent Blocks.
 * * * KEY ARCHITECTURAL CONCEPTS:
 * 1. Normalized Structure: Files are stored in buckets keyed by `folderId`. 
 * Each bucket uses `byId` (lookup) and `allIds` (order) for O(1) access and stable rendering.
 * 2. Nested Update Logic: `ADD_BLOCK` and `UPDATE_BLOCK` perform targeted updates 
 * within a specific file's block dictionary, essential for high-performance editors.
 * 3. Immutable Principles: Leverages Immer (via Redux Toolkit) to safely perform 
 * "mutative" logic like `delete` and `push` while maintaining state integrity.
 * 4. Positional Insertion: `ADD_BLOCK` handles specific index insertion using `afterBlockId`, 
 * supporting the document flow of a block-based editor.
 */
import { IBlock } from "@/model/file.model"
import { FilesState, ReduxFile } from "@/types/state.type"
import { PayloadAction, createSlice } from "@reduxjs/toolkit"

const initialState: FilesState = {
    filesByFolder: {},
    currentFile: null,
    loading: false,
    error: null,
}

const fileSlice = createSlice({
    name: "file",
    initialState,
    reducers: {
        /**
         * @reducer ADD_FILE
         * Dynamically initializes folder buckets if they don't exist and 
         * prevents duplicate IDs in the ordering array.
         */
        ADD_FILE: (
            state, 
            action: PayloadAction<{
                folderId: string,
                file: ReduxFile,
            }>
        ) => {
            const { folderId, file} = action.payload;
            if (!state.filesByFolder[folderId]) {
                state.filesByFolder[folderId] = {
                    byId: {},
                    allIds: [],
                }
            }

           state.filesByFolder[folderId].byId[file._id] = file;
           if(!state.filesByFolder[folderId].allIds.includes(file._id)){
            state.filesByFolder[folderId].allIds.push(file._id);
           } 
        },

        /**
         * @reducer DELETE_FILE
         * Handles the removal of a file from a specific folder bucket. 
         * Includes logic to clear the 'currentFile' if the user was currently 
         * viewing the file being deleted.
         */
        DELETE_FILE: (
            state, 
            action: PayloadAction<{
                folderId: string;
                fileId: string;
            }>
        ) => {
                    const { folderId, fileId } = action.payload;
        
                    // Remove from byId dictionary
                    delete state.filesByFolder[folderId].byId[fileId];
        
                    // Remove from allIds array (immutable update)
                    state.filesByFolder[folderId].allIds = 
                    state.filesByFolder[folderId].allIds.filter((id: string) => id !== fileId); // Explicitly typed 'id' here
        
                    // If the deleted workspace was the current one, clear currentWorkspace
                    if (state.currentFile?._id === fileId) {
                        state.currentFile = null;
                    }
                },
        /**
         * @reducer UPDATE_FILE
         * Performs a shallow merge of file metadata while explicitly 
         * preserving blocks and blockOrder to avoid accidental data loss.
         */
        UPDATE_FILE: (
            state, 
            action: PayloadAction<{ 
                folderId: string;
                id: string;
                updates: Partial<ReduxFile>;
            }>
        ) => {
            const { folderId, id, updates } = action.payload;

            if(!state.filesByFolder[folderId]) return;

            const file = state.filesByFolder[folderId].byId[id];
            if(!file) return;
            state.filesByFolder[folderId].byId[id] = {
                ...file,
                ...updates,
                // keep these consistent unless explicitly part of the update
                blocks: updates.blocks !== undefined ? updates.blocks : file.blocks,
                blockOrder: updates.blockOrder !== undefined ? updates.blockOrder : file.blockOrder,
            };
        },

        /**
         * @reducer SET_FILES
         * Bulk-loading utility for folder contents. 
         * Implements a "Bucket Validation" check to ensure incoming files are 
         * strictly mapped to their correct parent folder in the normalized state.
         */
        SET_FILES: (
            state, 
            action: PayloadAction<{
                folderId: string;
                files:ReduxFile[]
            }>
        ) => {
            const { folderId, files } = action.payload;

            if(!state.filesByFolder[folderId]){
                state.filesByFolder[folderId] = {
                    byId: {},
                    allIds: [],
                };
            }
            const folderState = state.filesByFolder[folderId];

            // add/update incoming files
            files.forEach(file => {
                // Only add if the file's internal folderId matched the target bucket
                if(file.folderId === folderId){
                    if(!folderState.byId[file._id]){
                        folderState.allIds.push(file._id);
                    }
                    folderState.byId[file._id] = file;
                }
            });
      
            state.loading = false;
            state.error = null;
        },

        /**
         * @reducer SET_CURRENT_FILE
         * Globally tracks the active file entity. 
         * This is the "Single Source of Truth" for the Editor and Banner components.
         */
        SET_CURRENT_FILE: (state, action: PayloadAction<ReduxFile | null>) => {
            state.currentFile = action.payload;
        },

        /**
         * @reducer SET_FILE_LOADING / SET_FILE_ERROR
         * Standardized status tracking for asynchronous operations. 
         * Drives UI skeletons, spinners, and error boundary messages.
         */
         SET_FILE_LOADING: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        SET_FILE_ERROR: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        /**
         * @reducer ADD_BLOCK
         * Logic for document structure. Supports appending to the end 
         * or inserting after a specific block for a natural editing experience.
         */
        ADD_BlOCK: (
            state,
             action: PayloadAction<{
                folderId: string;
                fileId: string;
                block: IBlock;
                afterBlockId: string;
             }>
            ) => {
            const { folderId, fileId, block, afterBlockId } = action.payload;
            const file = state.filesByFolder[folderId].byId[fileId];
            if(!file) return;

            file.blocks[block.id] = block;

            if(!afterBlockId){
                file.blockOrder.push(block.id);
            }else{
                const index = file.blockOrder.indexOf(afterBlockId);
                file.blockOrder.splice(index + 1, 0, block.id);
            }
        },

        /**
         * @reducer UPDATE_BLOCK
         * Deeply targets a single block's content. This allows the editor 
         * to sync individual line changes without affecting the rest of the file.
         */
        UPDATE_BLOCK: (
            state, 
            action: PayloadAction<{
                folderId: string;
                fileId: string;
                blockId: string;
                updates: any
            }>
        ) => {
            const { folderId, fileId, blockId, updates } = action.payload;

            // 1. Check if the folder bucket exists
            const folderBucket = state.filesByFolder[folderId];
            if(!folderBucket) return;

            // 2. Check if the file exists in that bucket
            const file = folderBucket.byId[fileId];
            if(!file || !file.blocks) return;

            // 3. Update the block
            file.blocks[blockId] = {
                ...file.blocks[blockId],
                ...updates
            };
        },
        DELETE_BLOCK: (
            state, 
            action: PayloadAction<{
                folderId: string;
                fileId: string;
                blockId: string;
            }>
        ) => {
            const { folderId, fileId, blockId } = action.payload;

            const folderBucket = state.filesByFolder[folderId];
            if(!folderBucket) return;

            const file = folderBucket.byId[fileId];
            if(!file) return;

            delete file.blocks[blockId];
            file.blockOrder = file.blockOrder.filter(id => id!== blockId);
        },
       RESET_FILES: (
            state,
        ) => {
           state.filesByFolder = {};
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
    ADD_BlOCK,
    UPDATE_BLOCK,
    DELETE_BLOCK,
    RESET_FILES,
} = fileSlice.actions

export default fileSlice.reducer;
