/**
 * @module WorkspaceSelectors
 * @description Centralized memoized selectors for the Workspace Redux slice.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Normalized State Access: Decouples 'allIds' (order) and 'byId' (data) to ensure 
 * that updates to one workspace don't trigger a re-render for the entire list.
 * 2. Memoized Derivation: `selectWorkspaces` ensures the array transformation only 
 * occurs if the underlying workspace IDs or data change.
 * 3. Atomic Selection: Provides direct access to loading, error, and "current" 
 * states for clean UI integration.
 * 4. O(1) Lookup: `selectWorkspaceById` provides instantaneous access to a specific 
 * workspace entity without scanning an array.
 */
import { RootState } from "@/store/store";
import { createSelector } from "@reduxjs/toolkit";

/**
 * @method selectCurrentWorkspace
 * @description Simple selector for the active workspace context.
 */
export const selectCurrentWorkspace = (state: RootState) =>
    state.workspace.currentWorkspace;

/**
 * @method selectWorkspaces
 * @description A memoized selector that reconstructs the workspace array from 
 * the normalized 'byId' and 'allIds' state.
 */
export const selectWorkspaces = createSelector(
    [
        (state: RootState) => state.workspace.allIds,
        (state: RootState) => state.workspace.byId
    ],
    (allIds, byId) => allIds.map(id => byId[id])
);

/**
 * @method selectWorkspaceById
 * @description Direct lookup by ID. Highly efficient for components that 
 * only need to display a specific workspace's details.
 */
export const selectWorkspaceById = (
    state: RootState,
    workspaceId: string
) => state.workspace.byId[workspaceId];

// --- Global UI State Selectors ---
export const selectWorkspaceLoading = (state: RootState) =>
    state.workspace.loading;


export const selectWorkspaceError = (state: RootState) =>
    state.workspace.error;

