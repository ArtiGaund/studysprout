/**
 * @slice folderSlice
 * @description Manages the normalized lifecycle of Folders within StudySprout. 
 * Organizes data into workspace-specific buckets to optimize large-scale state trees.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Workspace Isolation: Folders are keyed by `workspaceId`, ensuring that switching 
 * workspaces is a simple O(1) pointer swap in the UI.
 * 2. Idempotent Reducers: `ADD_FOLDER` checks for existing IDs, preventing UI 
 * duplication during high-frequency collaborative Socket.io events.
 * 3. Scope-Aware Loading: Implements `SET_FOLDER_LOADING` at the workspace level 
 * to allow independent loading states per workspace.
 * 4. Memory Hygiene: Provides `CLEAR_WORKSPACE_FOLDERS` and `RESET_FOLDERS_STATE` 
 * for targeted cleanup during workspace switching or user logout.
 */

import { FoldersState, ReduxFolder } from "@/types/state.type"
import { PayloadAction, createSlice } from "@reduxjs/toolkit"

const initialState: FoldersState = {
   foldersByWorkspace: {},
    currentFolder: null,
    loading: false,
    error: null,
    statsStale: false,
}

const folderSlice = createSlice({
    name: "folder",
    initialState,
    reducers: {
        /**
         * @reducer ADD_FOLDER
         * Implements defensive programming: rejects invalid data and 
         * prevents duplicate entries from concurrent socket/API updates.
         */
        ADD_FOLDER: (
            state,
             action: PayloadAction<{
                workspaceId: string;
                folder:ReduxFolder;
            }>
            ) => {
            const { workspaceId, folder } = action.payload;

            // Reject undefined IDs folders
            if(!folder._id){
                console.error(
                    "[ADD FOLDER Slice] Rejected: Attempted to add a folder without an _id, ",
                folder
                );
                return;
            }
            if(!state.foldersByWorkspace[workspaceId]){
                state.foldersByWorkspace[workspaceId] = {
                    byId: {},
                    allIds: [],
                };
            }

            const workspace = state.foldersByWorkspace[workspaceId];

            // check if exists: this prevents the second dispatch (from socket) from adding it again
            // if(workspace.byId[folder._id]){
            //     workspace.byId[folder._id] = { ...workspace.byId[folder._id], ...folder };
            //     return;
            // }
            // // new folder addition
            // workspace.byId[folder._id] = folder;

            workspace.byId[folder._id] = {
                ...workspace.byId[folder._id],
                ...folder
            };

            if(!workspace.allIds.includes(folder._id)){
                 workspace.allIds.push(folder._id);
            }
           
        },

        /**
         * @reducer DELETE_FOLDER
         * Performs a clean cascade: removes from the dictionary, filters the ordering array,
         * and clears the active selection if the deleted folder was currently open.
         */
        DELETE_FOLDER: (
            state,
             action: PayloadAction<{
                workspaceId: string;
                folderId: string;
             }>
            ) => {
                const { workspaceId, folderId } = action.payload;
                    
                    const workspace = state.foldersByWorkspace[workspaceId];
                    if(!workspace) return;
                    // Remove from byId dictionary
                    delete state.foldersByWorkspace[workspaceId].byId[folderId];
        
                    // Remove from allIds array (immutable update)
                    state.foldersByWorkspace[workspaceId].allIds = 
                    state.foldersByWorkspace[workspaceId].allIds.filter((id: string) => id !== folderId); // Explicitly typed 'id' here
        
                    // If the deleted workspace was the current one, clear currentWorkspace
                    if (state.currentFolder?._id === folderId) {
                        state.currentFolder = null;
                    }
                },

                /**
                 * @reducer UPDATE_FOLDER
                 * Performs a precise, partial update on a folder's metadata. 
                 * By spreading the existing state `...workspace.byId[id]`, it ensures 
                 * that we don't accidentally wipe out unedited fields (like iconId or bannerUrl) 
                 * while only updating the title.
                 */
                UPDATE_FOLDER: ( 
                    state, 
                    action: PayloadAction<{ 
                        workspaceId: string;
                        id: string;
                         updates: Partial<ReduxFolder>
                        }>
                ) => {
                    const { workspaceId, id, updates } = action.payload;
                    const workspace = state.foldersByWorkspace[workspaceId];
                    if(!workspace) return;
                    if(id && state.foldersByWorkspace[workspaceId].byId[id]){
                        state.foldersByWorkspace[workspaceId].byId[id] = {
                            ...state.foldersByWorkspace[workspaceId].byId[id],
                            ...updates,
                        }
                    }

                    if(state.currentFolder?._id === id){
                        state.currentFolder = {
                            ...state.currentFolder,
                            ...updates,
                        };
                    }
                },

        /**
         * @reducer SET_FOLDERS
         * Optimized bulk-injection. Reconstructs the workspace bucket to ensure 
         * the UI reflects the exact order and state returned by the server.
         */
        SET_FOLDERS: (
            state,
             action: PayloadAction<{
                workspaceId: string;
                folders:ReduxFolder[];
            }>
            ) => {

            const { workspaceId, folders } = action.payload;
            const byId: Record<string, ReduxFolder> = {};
            const allIds: string[] = [];
            folders.forEach(f => {
                byId[f._id] = f;
                allIds.push(f._id);
            });
            const workspace = state.foldersByWorkspace[workspaceId];
            if(!workspace) return;
            const existing = state.foldersByWorkspace[workspaceId] ?? {
                byId: {},
                allIds: []
            };
            existing.byId = byId;
            existing.allIds = allIds;

            state.foldersByWorkspace[workspaceId] = existing;
        },

        /**
         * @reducer SET_CURRENT_FOLDER
         * Synchronizes the "Active Selection" across the app. 
         * This allows the Editor and Sidebar to stay in sync without prop-drilling 
         * the folder object down the component tree.
         */
         SET_CURRENT_FOLDER: (state, action: PayloadAction<ReduxFolder | null>) => {
            state.currentFolder = action.payload;
        },

        /**
         * @reducer SET_FOLDER_LOADING
         * Implements "Scoped Loading." By tracking loading states per workspaceId, 
         * we prevent a "Global Loading Spinner" that would lock the entire app. 
         * This allows one workspace to fetch data while others remain interactive.
         */
         SET_FOLDER_LOADING: (
            state, 
            action: PayloadAction<{workspaceId: string; loading: boolean}>
        ) => {
            const { workspaceId, loading } = action.payload;

            if(!state.foldersByWorkspace[workspaceId]){
                state.foldersByWorkspace[workspaceId] = {
                    byId: {},
                    allIds: [],
                    loading: false,
                };
            }
            state.foldersByWorkspace[workspaceId].loading = loading;
        },

        /**
         * @reducer SET_FOLDER_ERROR
         * Centralized error handling. Captures API failures to be consumed 
         * by Toast notifications or Error Boundary components.
         */
        SET_FOLDER_ERROR: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },

        /**
         * @reducer CLEAR_WORKSPACE_FOLDERS
         * Prevents "State Ghosting." Clears out memory for a specific workspace 
         * when it's no longer being viewed.
         */
        CLEAR_WORKSPACE_FOLDERS: (
            state,
            action: PayloadAction<string>
        ) => {
            const workspaceId = action.payload;

            // Option A: Specific cleanup ( Preventing ghosting when switching)
            if(state.foldersByWorkspace[workspaceId]){
                delete state.foldersByWorkspace[workspaceId];
            }
        },

        /**
         * @reducer RESET_FOLDERS_STATE
         * Critical for Security and Privacy. 
         * Completely purges all folder data from the Redux store. 
         * This should be dispatched during the 'Logout' flow to ensure 
         * no sensitive organizational data persists in the browser memory for the next user.
         */
        RESET_FOLDERS_STATE: (
            state
        ) => {
            // Option B: Total cleanup (Use on Logout)
            state.foldersByWorkspace = {};
        },
         MARK_FOLDER_STATS_STALE:(state) => {
            state.statsStale = true;
        },
        MARK_FOLDER_STATS_FRESH:(state) => {
            state.statsStale = false;
        }
    }
})

export const {
    ADD_FOLDER,
    DELETE_FOLDER,
    UPDATE_FOLDER,
    SET_FOLDERS,
    SET_CURRENT_FOLDER,
    SET_FOLDER_LOADING,
    SET_FOLDER_ERROR,
    CLEAR_WORKSPACE_FOLDERS,
    RESET_FOLDERS_STATE,
    MARK_FOLDER_STATS_FRESH,
    MARK_FOLDER_STATS_STALE,
} = folderSlice.actions

export default folderSlice.reducer;
