/**
 * @hook useFlashcardGenerationLock
 * @description A real-time synchronization hook that manages distributed resource locks. 
 * Prevents concurrent AI generation tasks on the same resource within a workspace.
 * * COLLABORATIVE FEATURES:
 * 1. Distributed Mutex: Visualizes and enforces "Busy" states across multiple client sessions.
 * 2. Real-time Progress Sync: Streams generation telemetry (progress, total cards) via WebSockets.
 * 3. Scope Management: Filters locks to distinguish between "Local Resource Busy" and "Global Workspace Activity."
 * 4. Automatic Cleanup: Relies on server-side socket events to release locks upon task completion or disconnection.
 */

import { useSocket } from "@/lib/providers/socket-provider";
import { useEffect, useState } from "react";

export interface GenStatus{
    resourceId: string;
    username: string;
    progress: number;
    totalCards: number;
    currentCount: number;
}

export function useFlashcardGenerationLock(
    workspaceId: string,
    currentResourceId: string,
){
    const { socket, isConnected } = useSocket();
    const [allLocks, setAllLocks ] = useState<GenStatus[]>([]);

    /**
     * @effect Socket Lifecycle Management
     * Synchronizes the local lock state with the global workspace state.
     */
    useEffect(() => {
        if(!workspaceId || !socket || !isConnected) return;

        // Listener for the new array-based update
        const handleLocksUpdate = (locks: GenStatus[]) => {
            setAllLocks(locks);
        }

       socket.on("workspace_locks_update", handleLocksUpdate);

        // Initial Fetch: Ensures UI is consistent if the user joins mid-generation
        socket.emit("get_workspace_locks", { workspaceId });

        return () => {
            socket.off("workspace_locks_update", handleLocksUpdate);
        }
    },[
        workspaceId,
        socket,
        isConnected,
    ]);

    /**
     * @section Derived Lock Logic
     * Efficiently parses the lock array to provide specific UI feedback.
     */

    // 1. Contextual Lock: Check if the user is currently looking at the resource being generated
    const myProgress = (allLocks || []).find(l => 
        String(l.resourceId) === String(currentResourceId));

    // 2. Peer Activity: Identifies activity on other resources to show "System Busy" indicators
    const otherProgress = (allLocks || []).filter( l => 
        String(l.resourceId) !== String(currentResourceId)).pop();


    return {
        // Data for progress bars and status text
        myProgress,
        otherProgress,

        // Boolean flags for UI disabling/state-switching
        isLocked: allLocks.length > 0,
        isCurrentResourceBusy: !!myProgress,
        activeLocksCount: allLocks.length,
    }
}