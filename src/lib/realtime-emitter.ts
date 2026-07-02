/**
 * @utility emitRealtimeEvent
 * @description A hybrid communication utility that bridges HTTP requests to WebSocket broadcasts.
 * * ARCHITECTURAL ADVANTAGES:
 * 1. Reliability: Offloads event emission to a robust HTTP POST, reducing reliance on the 
 * active state of the client's WebSocket for outbound data.
 * 2. Origin Tracking: Includes `senderSocketId` to allow the backend to implement 
 * "Broadcast Except Sender," preventing redundant UI updates for the actor.
 * 3. Environment Awareness: Safely handles SSR (Server-Side Rendering) by checking the 
 * `window` object before attempting to access socket state.
 * 4. Error Resilience: Implements a clean try-catch block to prevent UI crashes during network failures.
 */
import { getSocket } from "./socket/socket";

// Endpoint union type
type RealtimeEndpoint =
    | "workspace-tree-update"
    | "workspace-members-update"
    | "file-update"
    | "progress-update"
    | "set-created"
    | "set-deleted"
    | "set-updated"
    | "set-regenerated"
    | "card-regenerated"
    | "set-outdated"
    | "file-stats-updated"
    | "activity-created"   
    | "workspace-invitation"
    | "workspace-invitation-response"
    | "notification"
    | "workspace-joined"
    | "workspace-left"    
    | "usage-updated";

/**
 * @function emitRealtimeEvent
 * Sends an HTTP POST to the realtime server which then broadcasts via Socket.io
 */
export const emitRealtimeEvent = async(
    endpoint: RealtimeEndpoint,
    workspaceId: string,
    eventType: string,
    payload: any
) => {
    let socketId = null;

    //  --- Client-Side Validation ---
    // Safely retrieve the current Socket ID to inform the backend who the sender is.
    if(typeof window !== "undefined"){
         const socket = getSocket();
         socketId = socket?.id;
    }
   
   try {
    /**
      * @action POST to Realtime Bridge
      * This pattern is common in microservice architectures where a dedicated 
      * 'Realtime Service' handles the heavy lifting of Socket.io room management.
      */
     const response = await fetch(`${process.env.NEXT_PUBLIC_REALTIME_URL}/emit/${endpoint}`, {
         method: "POST",
         headers: { "Content-Type": "application/json"},
         body: JSON.stringify({
             workspaceId,
             senderSocketId: socketId,
             type: eventType,
             payload: {
                 ...payload,
                 senderSocketId: socketId,
             }
         }),
     });

     // --- Validation ---
     if(!response.ok){
        throw new Error(`HTTP error! status: ${response.status}`);
     }
     return response;
   } catch (error) {
        /**
         * @logging 
         * Essential for debugging distributed systems where silent failures 
         * can lead to "de-synced" collaborative states.
         */
        console.error(`[Realtime] Failed to emit ${eventType}: `,error);
   }
}

/**
 * @function emitServerRealtimeEvent
 * Sever-side only variant - used from API route where `window` is unavailable.
 */
const SERVER_URL = process.env.REALTIME_SERVER_URL ?? process.env.NEXT_PUBLIC_REALTIME_URL;

export async function emitServerRealtimeEvent(
    endpoint: string,
    body: Record<string, any>,
): Promise<void>{
    try {
        const res = await fetch(`${SERVER_URL}/emit/${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if(!res.ok) console.error(`[Realtime] POST /emit/${endpoint} failed - ${res.status}`);
    } catch (error) {
        console.error(`[Realtime] POST /emit/${endpoint} error: `,error);
    }
}

/**
 * Typed convenience wrappers
 */
export const emitSetCreated = ( workspaceId: string,resourceId: string) => 
    emitServerRealtimeEvent("set-created", { workspaceId, resourceId });

export const emitSetDeleted = (workspaceId: string, setId: string) =>
    emitServerRealtimeEvent("set-deleted", { workspaceId, setId });

export const emitSetUpdated = (workspaceId: string, setId: string, updates: { title?: string}) =>
    emitServerRealtimeEvent("set-updated", { workspaceId, setId, updates });

export const emitSetOutdated = (workspaceId: string, setId: string) =>
   emitServerRealtimeEvent("set-outdated", { workspaceId, setId });

export const emitSetRegenerated =(workspaceId: string,setId: string,resourceId: string)=>
   emitServerRealtimeEvent("set-regenerated", { workspaceId, setId, resourceId });

export const emitCardRegenerated = (workspaceId: string,setId: string,cardId: string,) =>
    emitServerRealtimeEvent("card-regenerated", { workspaceId, setId, cardId });

export const emitFileStatsUpdated = (
    workspaceId: string,
    folderId: string,
    fileId: string,
    readingTimeMinutes: number,
) => emitServerRealtimeEvent("file-stats-updated", {
        workspaceId,
        folderId,
        fileId,
        readingTimeMinutes,
    });

export const emitActivityCreated = (
    workspaceId: string,
    events: {
        type: string;
        description: string;
        metadata?: Record<string,any>;
    }
) => emitServerRealtimeEvent("activity-created", { workspaceId, events });

export const emitWorkspaceTreeUpdate = (
    workspaceId: string,
    type: string,
    payload: Record<string, any>,
    senderSocketId?: string,
) => emitServerRealtimeEvent("workspace-tree-update", {
    workspaceId,
    type,
    payload,
    senderSocketId,
});

export const emitUsageUpdated = (workspaceId: string) =>
    emitServerRealtimeEvent("usage-updated", { workspaceId });