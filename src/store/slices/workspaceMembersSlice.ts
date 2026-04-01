/**
 * @slice workspaceMembersSlice
 * @description Manages the collaborative state and membership registry for StudySprout. 
 * Facilitates access control and peer-presence features.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Segmented State Architecture: Organizes members by `workspaceId` buckets, 
 * allowing for independent loading and error states per project.
 * 2. Role Distinction: Explicitly separates the `owner` from the `members` array, 
 * enabling high-performance UI checks for administrative privileges.
 * 3. Atomic Updates: `ADD_WORKSPACE_MEMBER` and `REMOVE_WORKSPACE_MEMBER` support 
 * real-time UI synchronization, essential for live collaborative environments.
 * 4. Lazy Initialization: `SET_WORKSPACE_MEMBERS_LOADING` ensures a workspace bucket 
 * is safely initialized even before the primary data fetch completes.
 */
import { WorkspaceMember } from "@/types/workspace-member.type"
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** * @type WorkspaceMembersState 
 * normalized structure to support multi-workspace tenancy.
 */
type WorkspaceMembersState = {
    byWorkspaceId: {
        [ workspaceId: string ]: {
            owner: WorkspaceMember | null,
            members: WorkspaceMember[],
            loading: boolean,
            error: string | null,
        };
    };
};

const initialState: WorkspaceMembersState = {
    byWorkspaceId: {},
}

const workspaceMembersSlice = createSlice({
    name: "workspaceMembers",
    initialState,
    reducers: {
        /**
         * @reducer SET_WORKSPACE_MEMBERS
         * Bulk hydration of the membership list. Standardizes the registry 
         * after a full API fetch of workspace collaborators.
         */
        SET_WORKSPACE_MEMBERS(
            state,
            action: PayloadAction<{
                workspaceId: string;
                owner: WorkspaceMember | null;
                members: WorkspaceMember[]
            }>
        ){
            const { workspaceId, owner, members } = action.payload;
            state.byWorkspaceId[workspaceId] = {
                owner,
                members,
                loading: false,
                error: null,
            };
        },

        /**
         * @reducer SET_WORKSPACE_MEMBERS_LOADING
         * @description Manages the asynchronous state of membership data.
         * * KEY LOGIC:
         * 1. Lazy Initialization: If a workspace doesn't have a bucket yet, 
         * it creates a "Skeleton" state with null values but sets 'loading' to true.
         * 2. UX Stability: By tracking loading per workspaceId, the UI can show 
         * a spinner in the "Members Sidebar" without affecting the "File Tree" 
         * or other active components.
         */
        SET_WORKSPACE_MEMBERS_LOADING(
            state,
            action: PayloadAction<{
                workspaceId: string;
                loading: boolean;
            }>
        ){
            const { workspaceId, loading } = action.payload;
            
            if(!state.byWorkspaceId[workspaceId]){
                state.byWorkspaceId[workspaceId] = {
                    owner: null,
                    members: [],
                    loading,
                    error: null,
                };
            }else{
                state.byWorkspaceId[workspaceId].loading = loading;
            }
        },

        /**
         * @reducer ADD_WORKSPACE_MEMBER
         * Real-time sync reducer. Invoked when a Socket.io event signals 
         * a new collaborator has accepted an invitation.
         */
        ADD_WORKSPACE_MEMBER(
            state,
            action: PayloadAction<{
                workspaceId: string;
                member: WorkspaceMember;
            }>
        ){
            const { workspaceId, member } = action.payload;

            state.byWorkspaceId[workspaceId]?.members.push(member);
        },

        /**
         * @reducer REMOVE_WORKSPACE_MEMBER
         * Handles member departure or administrative removal. 
         * Ensures the UI reflects the reduction in access immediately.
         */
        REMOVE_WORKSPACE_MEMBER(
            state,
            action: PayloadAction<{
                workspaceId: string;
                userId: string;
            }>
        ){
            const { workspaceId, userId } = action.payload;

            const workspace = state.byWorkspaceId[workspaceId];
            if(!workspace) return;

            workspace.members = workspace.members.filter( member => member._id !== userId );
        },
    },
});

export const {
    SET_WORKSPACE_MEMBERS,
    SET_WORKSPACE_MEMBERS_LOADING,
    ADD_WORKSPACE_MEMBER,
    REMOVE_WORKSPACE_MEMBER,
} = workspaceMembersSlice.actions;

export default workspaceMembersSlice.reducer;