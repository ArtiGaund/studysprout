/**
 * @hook useFilePresence
 * @description A real-time synchronization hook for monitoring collaborative presence.
 * * MULTIPLAYER FEATURES:
 * 1. Scope-Bound Presence: Automatically joins a specific 'File Room' on mount.
 * 2. Active User Tracking: Maintains a reactive state of all participants currently viewing the file.
 * 3. Lifecycle Management: Implements robust cleanup (socket.off/emit leave) to prevent memory leaks and "Ghost" users.
 * 4. Context Integration: Leverages the `useSocket` provider to ensure connection stability before emitting events.
 */
import { useSocket } from "@/lib/providers/socket-provider";
import { useEffect, useState } from "react"

export const useFilePresence = (
    fileId: string,
    currentUser: any
) => {
    // State to track other active participants in the current file context
    const [ activeUser, setActiveUser ] = useState<any[]>([]);
    const { socket, isConnected } = useSocket();
    useEffect(() => {
        // --- 1. Validation & Initialization ---
        // Ensure we have a valid file context, user identity, and an active socket connection
        if(!fileId || !currentUser?._id) return;

        if(!socket || !isConnected) return;

        /**
         * @event file:join
         * Notifies the server that the current user has entered the file room.
         * The server should handle adding this user to the specific Socket.io Room.
         */
        socket.emit("file:join", {
            fileId,
        });

        /**
         * @event file:presence
         * Listener for updates from the server whenever the room's participant list changes.
         * (e.g., when someone else joins or leaves).
         */
        socket.on("file:presence", (users: any[]) => {
            setActiveUser(users);
        });

        // --- 2. Cleanup / Teardown ---
        return () => {
            /**
             * @event file:leave
             * Informs the server that the user is navigating away or closing the file.
             */
            socket.emit("file:leave", {
                fileId,
            });

            // Removing the listener prevents state updates on unmounted components (Memory Leak protection)
            socket.off("file:presence");
        };
    },[
        fileId,
        currentUser?._id,
        socket,
        isConnected,
    ])

    /**
     * @returns Array of active user objects for rendering collaborative avatars or cursors.
     */
    return activeUser;
}