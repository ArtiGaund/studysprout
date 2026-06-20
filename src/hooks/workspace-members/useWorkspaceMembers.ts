/**
 * @hook useWorkspaceMembers
 * @description A specialized controller for managing Workspace-level membership and permissions.
 * * CORE ARCHITECTURE:
 * 1. Targeted State Management: Updates the `workspaceMembers` slice using a keyed lookup (`byWorkspaceId`) for high performance.
 * 2. Idempotent Fetching: Checks the current Redux state via `store.getState()` to bypass redundant API calls.
 * 3. Member Lifecycle: Encapsulates the logic for onboarding (addMember) and offboarding (removeMember) workspace collaborators.
 * 4. Ownership Logic: Differentiates between the 'Owner' and general 'Members' during the synchronization process.
 */
import { 
    addWorkspaceMember,
    getWorkspaceMembers, 
    removeWorkspaceMember
} from "@/services/workspaceMemberServices";
import { useAppDispatch } from "@/store/hooks";
import { selectUserId } from "@/store/selectors/userSelector";
import {
    ADD_WORKSPACE_MEMBER,
    REMOVE_WORKSPACE_MEMBER,
    SET_WORKSPACE_MEMBERS,
    SET_WORKSPACE_MEMBERS_LOADING 
} from "@/store/slices/workspaceMembersSlice";
import { DELETE_WORKSPACE } from "@/store/slices/workspaceSlice";
import store from "@/store/store";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSelector } from "react-redux";

export function useWorkspaceMembers(
    workspaceId?: string | null
){
    const currentUserId = useSelector(selectUserId);
    const dispatch = useAppDispatch();
    const router = useRouter();
    
    /**
     * @method fetchMembers
     * Syncs the workspace's administrative list with the Redux store.
     * Uses a direct store check for the 'Existing' state to prevent layout shifts.
     */
    const fetchMembers = useCallback(async (wid: string) => {
        const id = wid || workspaceId;
        if(!id) return;

        // 1. Efficiency Guard: Only fetch if this workspace's member list isn't already cached
        const existing = store.getState().workspaceMembers.byWorkspaceId[id];
        if(existing) return;
        dispatch(SET_WORKSPACE_MEMBERS_LOADING({
           workspaceId: id,
           loading: true
        }));
        try {
            const result = await getWorkspaceMembers(id);
            dispatch(SET_WORKSPACE_MEMBERS({
                workspaceId: id,
                owner: result.owner,
                members: result.members
            }));

        } catch (error) {
            console.warn("[useWorkspaceMembers] Failed to fetch workspace members: ", error);
        }finally{
            dispatch(SET_WORKSPACE_MEMBERS_LOADING({
                workspaceId: id,
                loading: false
            }));
        }
    },[
        workspaceId,
        dispatch
    ]);

    /**
     * @method addMember
     * Invites a new user to the workspace. 
     * Defaults new members to the "editor" role for collaborative parity.
     */
    const addMember = useCallback(async(userId: string) => {
        try {
            if(!workspaceId) return;
            const newMember = await addWorkspaceMember( workspaceId, userId, "editor");
            dispatch(ADD_WORKSPACE_MEMBER({
                workspaceId,
                member: newMember
            }));
        } catch (error) {
            console.error("[useWorkspaceMembers] Failed to add workspace member: ",error);
        }
    },[
        workspaceId,
    ])

    /**
     * @method removeMember
     * Revokes access for a specific user. 
     * Dispatches a removal action to the store to immediately update the "Who's Online" UI.
     */
    const removeMember = useCallback(async (userId: string) => {
        try {
            if(!workspaceId) return;
            await removeWorkspaceMember(workspaceId, userId);
            dispatch(REMOVE_WORKSPACE_MEMBER({
                workspaceId,
                userId
            }));
            if(userId === currentUserId){
                dispatch(DELETE_WORKSPACE(workspaceId));
                router.replace("/dashboard");
            }
        } catch (error) {
            console.error("[useWorkspaceMembers][removeMember] Failed to remove workspace member: ",error);
        }
    },[
        workspaceId,
        dispatch,
        currentUserId,
        router,
    ])

    return {
        fetchMembers,
        addMember,
        removeMember,
    }
}