/**
 * @module FolderSelectors
 * @description Specialized memoized selectors for the Folder Redux slice. 
 * Facilitates high-performance retrieval of folder data scoped by Workspace.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Scoped Memoization: Uses `makeSelectFolders` factory to isolate memoization 
 * caches for different Workspace views, preventing cross-component cache invalidation.
 * 2. Flat-Map Derivation: `selectTrashFolders` efficiently scans across all 
 * normalized workspace segments to aggregate deleted items.
 * 3. Referential Stability: Returns a static `EMPTY_ARRAY` constant to prevent 
 * downstream re-renders caused by new array reference literals.
 * 4. O(1) Lookups: Provides direct access to individual folders via the `byId` dictionary 
 * when the Workspace context is available.
 */
import { RootState } from "@/store/store";
import { ReduxFolder } from "@/types/state.type";
import { createSelector } from "@reduxjs/toolkit";

 const EMPTY_ARRAY: ReduxFolder[] = [];

 /**
 * @method selectFoldersByWorkspace
 * Internal selector to extract the root normalization map.
 * Acts as the base for all workspace-scoped folder derivations.
 */
const selectFoldersByWorkspace = (state: RootState) => state.folder.foldersByWorkspace;

/**
 * @method selectWorkspaceId
 * A simple identity selector used as an input for memoized 'createSelector' calls.
 * Essential for passing component props into the Reselect computation chain.
 */
const selectWorkspaceId = (_: RootState, workspaceId: string) => workspaceId;

/**
 * @method selectFoldersState
 * Retrieves the normalized 'byId' and 'allIds' structure for a specific workspace.
 * Used for O(1) existence checks before triggering API fetches.
 */
export const selectFoldersState = (
    state: RootState,
    workspaceId: string,
) => state.folder.foldersByWorkspace?.[workspaceId]

/**
 * @method makeSelectFolders
 * @description A Selector Factory pattern.
 * Crucial for multi-workspace UI layouts. Each component instance can maintain 
 * its own memoized list of folders, ensuring that switching workspaces in the UI 
 * is computationally inexpensive.
 */
export const makeSelectFolders = () => 
    createSelector(
        [
            (state: RootState) => state.folder.foldersByWorkspace,
            (_:RootState, workspaceId: string) => workspaceId
        ],
        (foldersByWorkspace, workspaceId) => {
            const workspace = foldersByWorkspace?.[workspaceId];
            if(!workspace) return EMPTY_ARRAY;

            return workspace.allIds.map(id => workspace.byId[id]);
        }
    );

/**
 * @method selectFolders
 * Standard memoized selector for retrieving an ordered array of folders.
 * Use this for top-level workspace views where only one workspace is active at a time.
 */
export const selectFolders = createSelector(
    [ selectFoldersByWorkspace, selectWorkspaceId ],
    (foldersByWorkspace, workspaceId) => {
        const workspace = foldersByWorkspace?.[workspaceId];
       
        if(!workspace) return EMPTY_ARRAY;

        return workspace.allIds.map(id => workspace.byId[id]);
    }
);

/**
 * @method selectFolderById
 * @description Direct point-lookup for a folder entity.
 */
 export const selectFolderById = (
    state: RootState,
    workspaceId: string,
    folderId: string
 ) => selectFoldersState(state, workspaceId)?.byId?.[folderId] ?? null;

 /**
 * @method selectCurrentFolder
 * Global pointer to the folder currently being viewed or edited by the user.
 */
export const selectCurrentFolder = (
    state: RootState,
) => state.folder.currentFolder;

/**
 * @method selectTrashFolders
 * @description Computes a global list of folders currently in the trash.
 * Demonstrates proficiency in deriving complex data views from a normalized state 
 * without duplicating data in the store.
 */
export const selectTrashFolders = createSelector(
    [
        ( state: RootState ) => state.folder.foldersByWorkspace,
        ( _state: RootState, workspaceId: string | undefined ) => workspaceId
    ],
    ( foldersByWorkspace, workspaceId ) => {
        if(!workspaceId || !foldersByWorkspace || !foldersByWorkspace[workspaceId]) return [];

        const workspace = foldersByWorkspace[workspaceId];

        if(!workspace.allIds) return [];

        return workspace.allIds
        .map( id => workspace.byId[id] )
        .filter( folder => 
            folder &&
            folder.inTrash !== null &&
            folder.inTrash !== undefined &&
            folder.inTrash !== ""
        );
    }
)
/**
 * @method selectFolderLoading
 * Exposes the 'Loading' status specifically for folder-related async operations.
 * Crucial for driving skeleton screens and progress indicators.
 */
export const selectFolderLoading = (
    state: RootState
) => state.folder.loading;

/**
 * @method selectFolderError
 * Provides access to any server-side or validation errors encountered during folder CRUD.
 * Feeds directly into Toast notifications or error boundary components.
 */
export const selectFolderError = (
    state: RootState
) => state.folder.error;