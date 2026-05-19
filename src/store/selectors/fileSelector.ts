/**
 * @module FileSelectors
 * @description specialized memoized selectors for the File Redux slice. 
 * Implements advanced Reselect patterns to optimize performance across the workspace tree.
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. Factory Selector Pattern: Uses `makeSelectFiles` to create unique selector instances 
 * per component, preventing cache-misses when multiple folders are rendered simultaneously.
 * 2. State Normalization Access: Efficiently maps `allIds` to `byId` dictionaries to 
 * derive ordered arrays for the UI.
 * 3. Cross-Slice Aggregation: `selectTrashFiles` demonstrates complex state derivation 
 * by flattening multiple nested folder structures into a single global list.
 * 4. Memoized Derivation: Ensures that expensive array operations (like `.map` or `.filter`) 
 * only run when the underlying source data actually changes.
 */
import { RootState } from "@/store/store";
import { ReduxFile } from "@/types/state.type";
import { createSelector } from "@reduxjs/toolkit";

const EMPTY_ARRAY: ReduxFile[] = [];

/**
 * @section Basic Selectors
 * Simple mapping functions to extract raw state fragments.
 */
const selectFilesByFolder = (state: RootState) =>
    state.file.filesByFolder;
const selectFolderId = ( _: RootState, folderId: string) => folderId;

export const selectFilesState = (
    state: RootState,
    folderId: string,
) => state.file.filesByFolder?.[folderId];

/**
 * @method makeSelectFiles
 * @description A Selector Factory. 
 * Essential for components like sidebars where multiple 'Folder' components exist. 
 * By creating a unique selector instance for each folder, we maintain independent 
 * memoization caches.
 */
export const makeSelectFiles = () => 
    createSelector(
        [
            (state: RootState) => state.file.filesByFolder,
            (_: RootState, workspaceId: string) => workspaceId
        ],
        (filesByFolder, folderId) => {
            const folder = filesByFolder?.[folderId];
            if(!folder) return EMPTY_ARRAY;

            return folder.allIds.map(id => folder.byId[id]);
        }
    );

/**
 * @method selectTrashFiles
 * @description Global trash aggregator. 
 * Scans all folders to find files marked with 'inTrash', providing a 
 * unified view for the 'Trash' recovery UI.
 */
export const selectFiles = createSelector(
    [ selectFilesByFolder, selectFolderId],
    (filesByFolder, folderId) => {
        const folder = filesByFolder?.[folderId];

        if(!folder) return EMPTY_ARRAY;

        return folder.allIds.map(id => folder.byId[id]);
    }
);

/**
 * @method selectFileById
 * @description Point-lookup for a specific file. 
 * Optimized for direct access when the folder context is known.
 */
export const selectFileById = (
    state: RootState,
    folderId: string,
    fileId: string,
) => selectFilesState(state,folderId)?.byId?.[fileId] ?? null;

/**
 * @method selectCurrentFile
 * @description Retrieves the file entity currently active in the main editor.
 * Used by the Editor and Banner components to sync content and metadata.
 */
export const selectCurrentFile = (
    state: RootState
) => state.file.currentFile;

/**
 * @method selectTrashFiles
 * @description A high-performance global aggregator for deleted content.
 * logic:
 * 1. Flattens all nested folder-to-file mappings into a single array.
 * 2. Filters for entities where 'inTrash' is true.
 * This provides a unified "Recycle Bin" view without redundant database queries.
 */
export const selectTrashFiles = createSelector(
    [ 
        (state: RootState) => state.file.filesByFolder,
        (state: RootState) => state.folder.foldersByWorkspace,
        ( _state: RootState, workspaceId: string | undefined ) => workspaceId
    ],
    (filesByFolder, foldersByWorkspace , workspaceId) => {
        // if(!workspaceId || !filesByFolder || !filesByFolder[workspaceId]) return [];
        if(!workspaceId || !foldersByWorkspace[workspaceId]) return [];

        // Targeted Scan: Only look at folders inside this workspace
        const workspaceFolderIds = foldersByWorkspace[workspaceId].allIds;

        return workspaceFolderIds.flatMap(folderId => {
            const bucket = filesByFolder[folderId];
            if(!bucket) return [];

            return bucket.allIds
            .map(id => bucket.byId[id])
            .filter(file => file && file.inTrash);
        })
    }
)

/**
 * @method selectFileLoading
 * @description Global loading state for file-related operations.
 * Drives skeleton loaders and progress spinners during API transitions.
 */
export const selectFileLoading = (
    state: RootState
) => state.file.loading;

/**
 * @method selectFileError
 * @description Global error state for file operations.
 * Used to trigger boundary-level error messages or toast notifications 
 * when a file-service action fails.
 */
export const selectFileError = (
    state: RootState
) => state.file.error;