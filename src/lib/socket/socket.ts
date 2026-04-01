/**
 * @module SocketClient
 * @description A Singleton Manager for the Socket.io client instance.
 * * ARCHITECTURAL STRENGTHS:
 * 1. SSR Safety: Prevents execution in Node.js environments to avoid 'window is not defined' errors.
 * 2. Resource Management: Implements a Singleton pattern to prevent multiple active connections.
 * 3. Dynamic Authentication: Supports runtime updates to `auth` tokens without requiring a full socket teardown.
 * 4. Resilient Transports: Enforces `websocket`-only transport to bypass slower polling and prevent CORS-related "stickiness" issues.
 */
"use client";

import { io, Socket } from "socket.io-client";

// Persistent references outside the React lifecycle to maintain a true Singleton
let socket: Socket | null = null;
let currentUserId: string | null | undefined = null;

/**
 * @method getSocket
 * Retrieves or initializes the shared socket instance.
 * * Logic Flow:
 * - SSR Guard: Returns null if executed server-side.
 * - Lazy Initialization: Creates the connection only when a valid Token/UserId is provided.
 * - Credential Sync: If the UserId changes (e.g., account switch), it updates the socket auth 
 * metadata without leaking connections.
 */
export function getSocket(token?: string, userId?: string){

    // Guard against Server Side Rendering
    if(typeof window === "undefined") return null;
   
    // 1. If no socket exists AND no credentials provided, we can't do anything
    if(!socket && (!token || !userId)) return null;

    // 2. Initial setup
    if(!socket){
       
        // If we don't have a token yet, just stay silent.
        // The SocketProvider will eventually call this with credentials
        if(!token || !userId) return null;
       
        // Enforce secure WebSocket transport for production-grade low latency
        socket = io(process.env.NEXT_PUBLIC_REALTIME_URL!, {
            auth: { token },
            transports: [ "websocket"],
            reconnection: true,
            // reconnectionAttempts: Infinity,
        });
        registerGlobalListener(socket);
         currentUserId = userId;
        return socket;
    }

    // 3. Update the existing socket
    // token changed - just update auth, don't disconnect/reconnect the shared socket
    if(socket && userId && currentUserId !== userId){
        currentUserId = userId;
        socket.auth = { token };
       
        if(!socket.connected){
            socket.connect();
        }
    }
     return socket;
}

/**
 * @method registerGlobalListener
 * Standardized logging and health-check monitoring for the socket lifecycle.
 */
function registerGlobalListener(socket: Socket){

    socket.on("connect", () => {
        console.log("[socket] connected: ",socket.id);
    });

    socket.on("disconnect", reason => {
        console.warn("[socket] disconnected: ",reason);
    });

    socket.on("connect_error", err => {
        console.log("[socket] error: ",err);
    });
}

/**
 * @method disconnectSocket
 * Explicit cleanup utility. Crucial for logging out or switching users to 
 * prevent cross-session data leakage.
 */
export function disconnectSocket(){
    if(socket){
        socket.disconnect();
        socket = null;
        currentUserId = null;
    }
}