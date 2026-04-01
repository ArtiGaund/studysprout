/**
 * @module SocketProvider
 * @description Centralized React Context Provider for managing the Socket.io lifecycle.
 * * CORE ARCHITECTURE:
 * 1. Singleton Instance: Ensures only one socket connection exists per authenticated session.
 * 2. Auth-Gated Connection: Automatically connects/disconnects based on the Redux Auth state.
 * 3. Reactive Connection State: Exposes `isConnected` to allow UI components to show "Live" vs "Offline" status.
 * 4. Cleanup & Resource Management: Implements strict event listener removal to prevent memory leaks during hot-reloads.
 */
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSocket } from "../socket/socket";
import { useSelector } from "react-redux";
import { selectAuthStatus, selectAuthToken, selectUserId } from "@/store/selectors/userSelector";
import { Socket } from "socket.io-client";

// --- Context Definition ---
const SocketContext = createContext<{ 
    socket: Socket | null,
    isConnected: boolean
}>({
     socket: null,
     isConnected: false
    });

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const currentUserId = useSelector(selectUserId);
    const authStatus = useSelector(selectAuthStatus);
    const authToken = useSelector(selectAuthToken);
    
    // tracks the real-time status of the transport layer
    const [isConnected, setIsConnected ] = useState(false);

    /**
     * @effect Socket Lifecycle
     * Manages the instantiation and connection logic.
     * Triggered only when authentication credentials change.
     */
    useEffect(() => {
        // Guard Clause: Prevent connection attempts for unauthenticated users
        if(!authToken || authStatus !== "authenticated" || !currentUserId ) return;
    
       const socket = getSocket(authToken, currentUserId);

       if(!socket){
        console.warn("[Socket-provider] Socket initialization failed");
        return;
       }

    
    // --- Connection Handlers ---
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Explicitly trigger connection if the instance is currently idle
    if(socket.connected) setIsConnected(true);
    else socket.connect();

       const onError = (error: any) => console.log("[Socket-Provider] connect error: ",error);
       socket.on("connect_error", onError);


       // --- Cleanup Phase ---
        // Vital for preventing "Zombie Listeners" in Single Page Applications
       return () => {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("connect_error", onError);
       }
    },[
        authToken,
        authStatus,
        currentUserId,
    ])

    /**
     * @memoized contextValue
     * Optimizes performance by preventing re-renders of the entire 
     * component tree unless the connection status actually changes.
     */
    const contextValue = useMemo(() => ({
        socket: getSocket(),  //This will return the instance created in useEffect
        isConnected,
    }),[
        isConnected
    ])

    return (
        <SocketContext.Provider value={{ socket: getSocket(), isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}

/**
 * @hook useSocket
 * @description Custom hook for consuming the socket context with ease.
 */
export const useSocket = () => useContext(SocketContext);