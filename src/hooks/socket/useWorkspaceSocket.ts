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

import { useEffect, useRef } from "react";
import { useWorkspaceMembers } from "../workspace-members/useWorkspaceMembers";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useToast } from "@/components/ui/use-toast";
import { useSelector } from "react-redux";
import { selectCurrentWorkspace } from "@/store/selectors/workspaceSelector";
import { selectUserId } from "@/store/selectors/userSelector";
import { registerWorkspaceEvents } from "@/lib/socket/socket-event";
import { useSocket } from "@/lib/providers/socket-provider";

export function useWorkspaceSocket(workspaceId?: string | null){
    const { socket, isConnected } = useSocket();
    const currentUserId = useSelector(selectUserId);

    // --- State Guards ---
    const joinedRef = useRef<string | null>(null);
    const hasFetchedMemberRef = useRef(false);

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
    ])

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
        const handleMembersUpdate = ({
            userId,
            username,
            action
        }: any) => {
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
            currentUserId, {
            onMembersUpdate: handleMembersUpdate,
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
         ])

   
}