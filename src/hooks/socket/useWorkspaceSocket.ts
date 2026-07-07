/**
 * @hook useWorkspaceSocket
 * @description Manages the real-time lifecycle of a Workspace via WebSockets (Socket.io).
 * * KEY RESPONSIBILITIES:
 * 1. Room Management: Handles `workspace:join` and `workspace:leave` logic to ensure scoped data delivery.
 * 2. Event Registration: Plugs into a centralized `registerWorkspaceEvents` utility to sync remote changes to Redux.
 * 3. Connection Resilience: Implements auto-rejoin logic on socket reconnection.
 * 4. Collaborative UX: Triggers toast notifications for peer activities (members joining/leaving).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspaceMembers } from "../workspace-members/useWorkspaceMembers";
import { useAppDispatch } from "@/store/hooks";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import { selectUserId } from "@/store/selectors/userSelector";
import { registerWorkspaceEvents } from "@/lib/socket/socket-event";
import { useSocket } from "@/lib/providers/socket-provider";
import { 
    ADD_WORKSPACE_MEMBER, 
    REMOVE_WORKSPACE_MEMBER 
} from "@/store/slices/workspaceMembersSlice";
import { WorkspaceMember } from "@/types/workspace-member.type";
import { UPDATE_FOLDER } from "@/store/slices/folderSlice";

interface GenerationProgressState{
    resourceId: string;
    workspaceId: string;
    progress: number;
    totalCards: number;
};

interface UseWorkspaceSocketOptions{
    onUsageUpdated?: () => void;
    onFlashcardSetRegeneration?:(setId: string) => void;
    onCardRegeneration?: (setId: string, cardId: string) => void;
};
export function useWorkspaceSocket(
    workspaceId?: string | null,
    options?: UseWorkspaceSocketOptions,
){
    const { socket, isConnected } = useSocket();
    const currentUserId = useSelector(selectUserId);

    // --- State Guards ---
    const joinedRef = useRef<string | null>(null);
    const hasFetchedMemberRef = useRef(false);

    const [ generationProgress, setGenerationProgress ] = 
        useState<GenerationProgressState | null>(null);

    const {
        fetchMembers
    } = useWorkspaceMembers(workspaceId);
    const dispatch = useAppDispatch();
    const { toast } = useToast();
 
    /**
     * @section Member Data Loading
     * Ensures workspace member metadata is available locally before processing 
     * real-time presence or activity events.
     */
    useEffect(() => {
        if(!workspaceId) return;
        
        const loadMembers = async (workspaceId: string) => {
            if(!hasFetchedMemberRef.current){
            hasFetchedMemberRef.current = true;
            await fetchMembers(workspaceId);
        }
        }
       loadMembers(workspaceId);
    },[
        workspaceId,
    ]);

    /**
     * @callback handleGenerationProgress
     * Drives a workspace-wide AI generation progress bar
     */
    const handleGenerationProgress = useCallback((data: GenerationProgressState) => {
        setGenerationProgress(data);
    },[]);

    /**
     * @callback handleGenerationCompleted
     * Clears the progress bar once the matching job finishes.
     */
    const handleGenerationCompleted = useCallback(({ resourceId }: { resourceId: string }) => {
        setGenerationProgress((prev) => (prev?.resourceId === resourceId ? null : prev));
    },[]);

    /**
     * @callback handlePDFProgress
     * Route PDF import progress straight into the folder's Redux record, since the folder
     * list/sidebar UI reads progress directly off the folder entity.
     */
    const handlePDFProgress = useCallback(
        ({ folderId, progress }: { folderId: string, progress: number; }) => {
        if(!workspaceId) return;
        dispatch(UPDATE_FOLDER({
            workspaceId,
            id: folderId,
            updates: { progress } as any,
        }));
    },[
        dispatch,
        workspaceId,
    ]);

    /**
     * @callback handleUsageUpdated
     * Workspace-wide usage/quota changed
     */
    const handleUsageUpdated = useCallback(() => {
        if(!workspaceId) return;
        options?.onUsageUpdated?.();
    },[workspaceId, options]);

    const handleFlashcardSetRegeneration = useCallback((setId: string) => {
        options?.onFlashcardSetRegeneration?.(setId);
    },[options]);

    const handleCardRegeneration = useCallback((setId: string, cardId: string) => {
        options?.onCardRegeneration?.(setId, cardId);
    },[options]);

    const handlersRef = useRef({
        handlePDFProgress,
        handleUsageUpdated,
        handleGenerationProgress,
        handleGenerationCompleted,
        handleFlashcardSetRegeneration,
        handleCardRegeneration,
        toast,
    });

    useEffect(() => {
        handlersRef.current = {
            handlePDFProgress,
            handleUsageUpdated,
            handleGenerationProgress,
            handleGenerationCompleted,
            handleFlashcardSetRegeneration,
            handleCardRegeneration,
            toast,
        };
    });
    
    /**
     * @section Socket Lifecycle Management
     * Handles the "Room" logic. When a user switches workspaces, this effect 
     * ensures they leave the previous room and join the new one.
     */
    useEffect(() => {      
        // 1. Connection Guard: Ensure networking is ready
        if(!socket || !isConnected || !workspaceId || !currentUserId) return;   
        // 2. Idempotency Guard: Prevent redundant join emissions
        if(joinedRef.current === workspaceId) return;

        /**
         * @callback handleMembersUpdate
         * UI feedback for peer presence changes.
         */
        const handleMembersUpdate = async ({
            workspaceId,
            userId,
            username,
            action,
            member,
        }: {
            workspaceId: string;
            userId: string;
            username: string;
            action: "added" | "removed";
            member?: WorkspaceMember
        }) => {
            if(action === "removed"){
                dispatch(REMOVE_WORKSPACE_MEMBER({ 
                    workspaceId,
                    userId,
                }));
            }else if(member){
                dispatch(ADD_WORKSPACE_MEMBER({ workspaceId, member }));
            }else{
                console.warn("[useWorkspaceSocket] action=added but member is missing from payload!")
            }
            // don't notify the actor
            if(userId === currentUserId) return;

            toast({
                title: 
                action === "added"
                ? `${username} joined the workspace`
                : `${username} left the workspace`
            });
        }

        // 3. Centralized Event Registration
        // Attaches listeners for file/folder updates, presence, and tree changes.
        registerWorkspaceEvents(
            socket, 
            dispatch,
            currentUserId, 
            { 
                onMembersUpdate: handleMembersUpdate,
                onPDFProgress: (data: { folderId: string; progress: number}) => 
                    handlersRef.current.handlePDFProgress(data),
                onUsageUpdated: () => 
                    handlersRef.current.handleUsageUpdated(),
                onGenerationProgress: (data: {
                    resourceId: string;
                    workspaceId: string;
                    progress: number;
                    totalCards: number
                }) => 
                    handlersRef.current.handleGenerationProgress(data),
                onGenerationCompleted: (data: { resourceId: string }) => 
                    handlersRef.current.handleGenerationCompleted(data), 
                onFlashcardSetRegeneration: (setId: string) => 
                    handlersRef.current.handleFlashcardSetRegeneration(setId),
                onCardRegeneration: (setId: string, cardId: string) => 
                    handlersRef.current.handleCardRegeneration(setId, cardId),
            }
        );
      
        /**
         * @method joinWorkspace
         * Emits a join event with an acknowledgement pattern to confirm server-side room entry.
         */
        const joinWorkspace = () => {

            if (!socket.connected) return;
            
            socket.emit(
                "workspace:join", 
                { workspaceId },
                (ack?: { ok?: boolean; reason?: string }) => {
                    if (!ack || !ack.ok) {
                        console.error("[useWorkspaceSocket] Join failed:", ack?.reason);
                        toast({
                            title: "Failed to join workspace",
                            description: ack?.reason ? `Reason: ${ack.reason}` : "Could not connect to workspace",
                            variant: "destructive"
                        });
                        return;
                    }
                    
                    joinedRef.current =workspaceId;
                }
            );
        };

        // Execution: Join immediately and subscribe to reconnection events
        joinWorkspace();
        socket.on("connect", joinWorkspace);

        // 4. Cleanup Logic (Unmounting or Workspace Switch)
        return () => {
            socket.off("connect", joinWorkspace);

            if(joinedRef.current === workspaceId){
                socket.emit("workspace:leave", { workspaceId });
                joinedRef.current = null;
            }

        };
    },[
       socket,
       isConnected,
       workspaceId,
       currentUserId,
       dispatch,
    ]);

    return {
        generationProgress
    }
}