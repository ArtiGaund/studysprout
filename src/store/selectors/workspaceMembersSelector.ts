/**
 * @module WorkspaceMemberSelectors
 * @description specialized memoized selectors for managing Workspace membership and 
 * access control logic. 
 * * * KEY ARCHITECTURAL FEATURES:
 * 1. Relational Mapping: Isolates member data from workspace metadata to optimize 
 * re-renders in collaborative environments.
 * 2. Ownership Logic: Provides a direct `selectWorkspaceOwner` utility, essential 
 * for gating administrative UI features (Delete, Settings, Invite).
 * 3. Scope-Specific Loading: Tracks loading states per workspace, ensuring that 
 * "Member Lists" can load independently of the "File Tree."
 * 4. Memoized Arrays: Uses `createSelector` to ensure that the `members` array 
 * reference only changes when the actual membership list is updated.
 */
import { RootState } from "@/store/store"
import { createSelector } from "@reduxjs/toolkit";

/**
 * @section Raw State Extractors
 */
 const selectWorkspaceMembersByWorkspaceId = (state: RootState) =>
     state.workspaceMembers.byWorkspaceId;

 const selectWorkspaceId = ( _:RootState, workspaceId: string) => workspaceId;

export const selectWorkspaceMembersState = (
    state: RootState,
    workspaceId: string
) => state.workspaceMembers.byWorkspaceId[workspaceId];

/**
 * @method selectWorkspaceMembers
 * @description Returns the full list of members for a specific workspace.
 * Memoized to prevent heavy UI components (like a 'Share' modal or 'Avatar Stack') 
 * from re-rendering unless the membership actually changes.
 */
export const selectWorkspaceMembers = createSelector(
    [ selectWorkspaceMembersByWorkspaceId, selectWorkspaceId ],
    (byWorkspaceId, workspaceId) => {
        const workspace = byWorkspaceId?.[workspaceId];

        return workspace?.members ?? [];
    }
)

/**
 * @method selectWorkspaceOwner
 * @description Utility for Role-Based Access Control (RBAC). 
 * Used to verify if the current user has 'Superuser' privileges over the workspace.
 */
export const selectWorkspaceOwner = (
    state: RootState,
    workspaceId: string
) => selectWorkspaceMembersState(state, workspaceId)?.owner ?? null;

/**
 * @method selectWorkspaceMembersLoading
 * @description Tracks the fetch status of the membership list for a specific workspace.
 */
export const selectWorkspaceMembersLoading = (
    state: RootState,
    workspaceId: string
) => selectWorkspaceMembersState(state, workspaceId)?.loading ?? false;