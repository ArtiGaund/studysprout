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
import { getSocket } from "./socket/socket"

export const emitRealtimeEvent = async(
    endpoint: 'workspace-tree-update',
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