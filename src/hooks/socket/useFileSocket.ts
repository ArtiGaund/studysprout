/**
 * @hook useFileSocket
 * @description A specialized synchronization hook for real-time collaborative editing.
 * * KEY TECHNICAL PATTERNS:
 * 1. Room-Based Isolation: Implements "Join/Leave" patterns to scope events to specific File IDs.
 * 2. Echo Suppression: Explicitly filters out local updates using `userId` comparison to prevent infinite feedback loops.
 * 3. Lifecycle Management: Handles clean socket disconnection and event listener removal on component unmount.
 * 4. Auth Integration: Gates connection logic behind Redux-persisted auth tokens for secure data streaming.
 */
"use client";

import { useSocket } from "@/lib/providers/socket-provider";
import { selectAuthToken, selectUserId } from "@/store/selectors/userSelector";
import { useEffect } from "react";
import { useSelector } from "react-redux";

type UseFileSocketParams = {
    fileId: string;
    onRemoteUpdate: (update: any) => void;
};
export function useFileSocket({
    fileId,
    onRemoteUpdate,
}: UseFileSocketParams){
    const { socket, isConnected } = useSocket();
    const currentUserId = useSelector(selectUserId);
    const authToken = useSelector(selectAuthToken);

    /**
     * @effect Collaborative Session Management
     * Manages the lifecycle of the socket connection for a specific resource.
     */
    useEffect(() => {
        // --- Connection Guards ---
        if(!authToken || !currentUserId || !socket || !isConnected) return;

       // --- JOIN Logic ---
        // Notifies the server to add this client to a specific 'room' for the fileId
        socket.emit("file:join", { fileId });

       /**
         * @listener file:update
         * Receives granular updates (block changes, title edits, etc.) from other users.
         */
        const handleUpdate = ({ update, userId }: { update: any; userId: string; }) => {
            // CRITICAL: Ignore updates originated by the current user
            if(userId === currentUserId) return;

            onRemoteUpdate(update);
        }
        socket.on("file:update",handleUpdate);

        // Error Handling for network-level failures
        const handleError = (err: Error) => {
             console.error("[file socket error]", err.message);
        }
        socket.on("connect_error",handleError);

        /**
         * @cleanup
         * Prevents memory leaks and ghost connections by leaving the room
         * and stripping listeners when the editor is closed.
         */
        return () => {
            socket.emit("file:leave", { fileId });
            socket.off("file:update", handleUpdate);
            socket.off("connect_error", handleError);
        };
    },[
        authToken,
        currentUserId,
        fileId,
        onRemoteUpdate,
        isConnected,
        socket,
    ]);
}