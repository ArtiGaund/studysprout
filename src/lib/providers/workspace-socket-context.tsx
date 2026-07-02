/**
 * @module WorkspaceSocketContext
 * @description Bridges the Single useWorkspaceSocket call with any descendant component that
 * needs to react to events only reachable through registerWorkspaceEvents 'handlers' object -
 * specificially onUsageUpdated, onFlashcardRegeneration, and cardRegeneration.
 * 
 * Why this exists:
 * Calling useWorkspaceSocket a second time is not safe, despite seeming harmless at first glance
 * - WorkspaceSocketManager already calls it once at the workspace root and stays mounted for the
 * lifetime of the route. A second call site with an independent mount/unmount lifecycle creates
 * two independent effects both managing the same global socket's listeners through 
 * registerWorkspaceEvents - leading to listening thrashing and an unmount in one place 
 * potentially interfacing with the other's active listeners.
 * 
 */

"use client";

import React, { createContext, useCallback, useContext, useRef } from "react";

interface FlashcardRegenerationEvent{
    setId: string;
};

interface CardRegenerationEvent{
    setId: string;
    cardId: string;
};

type Listener<T> = (data: T) => void;

interface WorkspaceSocketContextValue{
    notifyUsageUpdated: () => void;
    notifySetRegeneration: (setId: string) => void;
    notifyCardRegeneration: (setId: string, cardId: string) => void;

    /* Subscribe from any descendant - return an unsubscribe function */
    onUsageUpdated: (listener: () => void ) => () => void;
    onSetRegeneration: (listener: Listener<FlashcardRegenerationEvent>) => () => void;
    onCardRegeneration: (listener: Listener<CardRegenerationEvent>) => () => void;
};

const WorkspaceSocketContext = createContext<WorkspaceSocketContextValue | null>(null);

export function WorkspaceSocketProvider({ children }: { children: React.ReactNode }){
    /**
     * Plain re-backed listener sets - this is pub/sub glue, not state that should trigger 
     * re-renders on its own.
     */
    const usageListeners = useRef<Set<() => void>>(new Set());
    const setRegenListeners = useRef<Set<Listener<FlashcardRegenerationEvent>>>(new Set());
    const cardRegenListeners = useRef<Set<Listener<CardRegenerationEvent>>>(new Set());

    const notifyUsageUpdated = useCallback(() => {
        usageListeners.current.forEach((fn) => fn());
    },[]);

    const notifySetRegeneration = useCallback((setId: string ) => {
        setRegenListeners.current.forEach((fn) => fn({ setId }));
    },[]);

    const notifyCardRegeneration = useCallback((setId: string, cardId: string) => {
        cardRegenListeners.current.forEach((fn) => fn({ setId, cardId }));
    },[]);

    const onUsageUpdated = useCallback((listener: () => void) => {
        usageListeners.current.add(listener);
        return () => usageListeners.current.delete(listener);
    },[]);

    const onSetRegeneration = useCallback(
        (listener: Listener<FlashcardRegenerationEvent>) => {
            setRegenListeners.current.add(listener);
            return () => setRegenListeners.current.delete(listener);
    },[]);

    const onCardRegeneration = useCallback(
        (listener: Listener<CardRegenerationEvent>) => {
            cardRegenListeners.current.add(listener);
            return () => cardRegenListeners.current.delete(listener);
    },[]);
    
    return (
        <WorkspaceSocketContext.Provider
            value={{
                notifyUsageUpdated,
                notifySetRegeneration,
                notifyCardRegeneration,
                onUsageUpdated,
                onSetRegeneration,
                onCardRegeneration,
            }}
        >
            {children}
        </WorkspaceSocketContext.Provider>
    )
}

export function useWorkspaceSocketContext(){
    const ctx = useContext(WorkspaceSocketContext);
    if(!ctx){
        throw new Error(
            "[useworkspaceSocketContext] must be used within a WorkspaceSocketProvider"
        );
    }

    return ctx;
}