/**
 * @hook useBacklinks
 * 
 * What it does:
 *      As the user types, check the current word/phrase against the workspace term index loaded 
 *      once at editor mount. If match is found, returns the backlink data so the editor can
 *      show a subtle underline + tooltip.
 * 
 * How it works:
 *      1. fetch /api/workspace/[workspaceId]/term-index once on mount -> cached in memory
 *      2. BlockNote's onChange gives us the current editor content as blocks
 *      3. On every word boundary we extract 1-, 2-, and 3- word windows from the active cursor 
 *          position and check them against the in-memory Map
 *      4. Return `activeBacklink` - the matched term + file list - for the UI to render
 * 
 * No server call on every keystroke. Map lookup is microseconds.
 */

"use client";

import { fetchWorkspaceTermIndex } from "@/services/workspaceServices";
import { useCallback, useEffect, useRef, useState } from "react";
import { string } from "zod";

// --- Types ---

export interface BacklinkFile{
    id: string;
    title: string;
}

export interface ActiveBacklink{
    terms: string;
    files: BacklinkFile[];
}

interface UseBacklinksReturn {
    activeBacklink: ActiveBacklink | null;
    termIndexLoaded: boolean;
    // Call this when the editor's onChange fires with the current plain text
    checkWordAtCursor: (wordAtCursor: string) => void;
}

// --- Max n-gram window size for matching ---
export const MAX_NGRAM = 3;

/**
 * @param workspaceId  The workspace to fetch the term index for
 * @param fileId        The file currently open - excluded from its own backlinks
 */

export function useBacklinks(
    workspaceId: string,
    fileId: string,
): UseBacklinksReturn{
    // termIndex: term -> array of { id, title }
    const termIndexRef = useRef<Map<string, BacklinkFile[]>>(new Map());
    const [ termIndexLoaded, setTermIndexLoaded ] = useState(false);
    const [ activeBacklink, setActiveBacklink ] = useState<ActiveBacklink | null>(null);

    // ---fetch term index once on mount ---
    useEffect(() => {
        if(!workspaceId) return;

        const controller = new AbortController();

        const load = async () => {
            try {
                const result = await fetchWorkspaceTermIndex(workspaceId, controller.signal);

                if(!result.success){
                    console.error("[useBacklinks] Failed to fetch workspace term index: ",result);
                }
                const termIndexData = result.data.termIndex as Record<string, BacklinkFile[]>;
                const map = new Map<string, BacklinkFile[]>();
                for(const [ term, files ] of Object.entries(termIndexData)){
                    // Excluded the current file from its own backlinks
                    const others = files.filter((f) => f.id !== fileId);
                    if(others.length > 0){
                        map.set(term.toLowerCase(), others);
                    }
                }

                termIndexRef.current = map;
                setTermIndexLoaded(true);
            } catch (error: any) {
                if(error.name !== "AbortError"){
                    console.warn("[useBacklinks] Failed to load term index: ",error);
                }
            }
        };
        load();
        return () => controller.abort();
    },[
        workspaceId,
        fileId,
    ]);

    // --- Check n-gram windows around cursor word ---

    /**
     * Call this from BlockNote's onChange or onSelectionChange.
     * Pass the word (or small phrase) at the current cursor position.
     */

    const checkWordAtCursor = useCallback((wordAtCursor: string) => {
        if(!termIndexLoaded || !wordAtCursor.trim()) {
            setActiveBacklink(null);
            return;
        }

        const index = termIndexRef.current;
        const tokens = wordAtCursor.trim().toLowerCase().split(/\s+/);

        // Try longest window first (3-gram -> 2-gram -> 1-gram)
        for(let n = Math.min(MAX_NGRAM, tokens.length); n >= 1; n--){
            // Slide window across the token array
            for(let i = 0;i <= tokens.length; i++){
                const phrase = tokens.slice(i, i + n).join(" ");
                const files = index.get(phrase);
                if(files && files.length > 0){
                    setActiveBacklink({
                        terms: phrase,
                        files,
                    });
                    return;
                }
            }
        }
        setActiveBacklink(null);
    },[
        termIndexLoaded,
    ]);

    return {
        activeBacklink,
        termIndexLoaded,
        checkWordAtCursor,
    };
}