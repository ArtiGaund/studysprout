import { 
    getPendingInvitationService, 
    respondToInvitationService, 
    sendWorkspaceInvitationService 
} from "@/services/workspaceMemberServices";
import { useCallback, useEffect, useState } from "react";

export interface PendingInvitation{
    _id: string;
    workspaceId: string;
    workspaceTitle: string;
    invitedBy: string;
    invitedByUsername: string;
    role: "editor" | "viewer";
    status: "pending";
    createdAt: string;
    updatedAt: string;
}

export function useWorkspaceInvitations(workspaceId: string){
    // --- Invites state ---
    // const [ pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
    const [ loadingInvitations, setLoadingInvitations ] = useState(false);

    // --- Owner State ---
    // Tracks which userId is currently having an invite sent (spinner control)
    const [ sendingInviteId, setSendingInviteId ] = useState<string | null>(null);
    // Persists which userIds have already been invited this session (UI badge)
    const [ invitedUserIds, setInvitedUserIds ] = useState<Set<string>>(new Set());

    // --- Invitee - fetch pending invitations ---
    const fetchPendingInvitations = useCallback(async () => {
        if(!workspaceId) return;
        setLoadingInvitations(true);
        try {
            const result = await getPendingInvitationService(workspaceId);
            setInvitedUserIds(new Set(result?.invitedUserIds ?? []));
        } catch (error) {
            console.error("[useWorkspaceInvitations] Failed to fetch pending invitations: ",error);
        }finally{
            setLoadingInvitations(false);
        }
    },[workspaceId]);

    useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);


    // --- Invitee - accept or reject ---
    const respondToInvite = useCallback(async(
        invitationId: string,
        action: "accepted" | "rejected",
    ) => {
        try {
            console.log(`[respondtoInvite] workspaceId:${workspaceId}, invitationId: ${invitationId}`);
            await respondToInvitationService(invitationId, action);
        } catch (error) {
            console.error("[useWorkspaceInvitations] Failed to respond to invitations: ",error);
            throw error;
        }
    },[
        workspaceId,
    ]);

    // --- Owner -- send invite ----
    const sendInvite = useCallback(async(
        userId: string,
    ) => {
        setSendingInviteId(userId);
        try {
            await sendWorkspaceInvitationService(userId, workspaceId);
            // Mark as invited so the button flips to "Invited ✓" without re-fetch
            setInvitedUserIds((prev) => new Set(prev).add(userId));
        } catch (error) {
            console.error("[useWorkspaceInvitations] Failed to send invitation: ",error);
            throw error;
        }finally{
            setSendingInviteId(null);
        }
    },[
        workspaceId,
    ]);

    return {
        // Invite
        // pendingInvitations,
        loadingInvitations,
        fetchPendingInvitations,
        // respondToInvite,
        // Owner
        sendingInviteId,
        invitedUserIds,
        sendInvite,
        respondToInvite,
    }
}