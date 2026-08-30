"use client";

import { InboxItem } from "@/types/state.type";
import { useCallback, useEffect, useState } from "react";
import { useInbox } from "./useInbox";

/**
 * @hook useInboItems
 * @description Stateful wrapper around useInbox's getInboxItems action.
 * Owns its own `items`/`loading` state per call site - deliberately NOT shared across components,
 * since the sidebar and the full inbox page each need independently fetch lifecycles (sidebar
 * only fetches when opened; page fetches on mount) with no requirement to stay in sync with
 * each other.
 */

// Event payload to sync both removals and restorations across instances
type SyncEvent = 
    | { type: "REMOVE"; itemId: string }
    | { type: "RESTORE"; item: InboxItem }

// Global listener set to sync optimistic removals across all hooks instances
const listeners = new Set<(event: SyncEvent) => void>();

export function useInboxItems(enabled: boolean = true, refreshKey: number = 0){
    const [ items, setItems ] = useState<InboxItem[]>([]);
    const [ loading, setLoading ] = useState(false);
    const { getInboxItems } = useInbox();

    const refetch = useCallback( async () => {
        if(!enabled) return;
        setLoading(true);
        const result = await getInboxItems();
        if(result.success) setItems(result.data ?? []);
        setLoading(false);
        return result;
    },[
        enabled,
        getInboxItems,
    ]);

    useEffect(() => {
        if(!enabled) return;
        let cancelled = false;

        (async() => {
            setLoading(true);
            const result = await getInboxItems();
            if(cancelled) return;
            if(result.success) setItems(result.data ?? []);
            setLoading(false);
        })();

        return () => {
            cancelled = true;
        }
    },[
        enabled,
        refreshKey,
        getInboxItems,
    ]);

    // Listen for local removals emitter by other instance(e.g. page tells sidebar to hide an item)
    useEffect(() => {
        // const handleRemoteRemove = (itemId: string) => {
        //     setItems((prev) => prev.filter((item) => item._id !== itemId ));
        // };
        // listeners.add(handleRemoteRemove);
        // return () => {
        //     listeners.delete(handleRemoteRemove);
        // };
        const handleRemoteEvent = ( event: SyncEvent ) => {
            if(event.type === "REMOVE"){
                setItems((prev) => prev.filter((item) => item._id !== event.itemId));
            }else if(event.type === "RESTORE"){
                setItems((prev) => {
                    if(prev.some((item) => item._id === event.item._id)) return prev;
                    return [ event.item, ...prev ];
                });
            }
        };

        listeners.add(handleRemoteEvent);
        return () => {
            listeners.delete(handleRemoteEvent);
        }
    }, []);

    const removeItem = useCallback((itemId: string) => {
        // 1. Remove from local instance
        setItems((prev) => prev.filter((item) => item._id !== itemId));
        // 2. Broadcast removal to all other active useInboxItems instances
        listeners.forEach((listener) => listener({ type: "REMOVE", itemId }));
    },[]);

    const restoreItem = useCallback((itemToRestore: InboxItem) => {
        setItems((prev) => {
            if(prev.some((item) => item._id === itemToRestore._id)) return prev;
            return [ itemToRestore, ...prev ];
        });
        listeners.forEach((listener) => listener({ type: "RESTORE", item: itemToRestore }));
    },[]);

    return {
        items,
        loading,
        refetch,
        removeItem,
        restoreItem,
        setItems,
    };
}