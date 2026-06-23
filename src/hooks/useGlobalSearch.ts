/**
 * @hook useGlobalSearch
 * 
 * All search logic in one place. Zero API calls until the user has typed atleast 2 characters
 * and paused for 300ms.
 * 
 * How API calls are minimised:
 * 
 * 1. Min 2 chars - single characters fire nothing. "n" -> no call.
 * 2. Debounce 300ms - the API is only called after the user STOPS typing for 300ms. Typing
 *  "neural" fires exactly 1 call, not 6.
 * 3. Abort controller - if the user types again before the previous response comes back, the 
 * previous request is cancelled immediately. This prevents stale results overwriting fresh ones.
 * 4. Cache - results for each query string are cached in a Map for the lifetime of the palette
 * being open. Typing "neu", deleting, retyping "neu" hits the cache, not the API.
 */
"use client";

import { SearchResult, SearchResultType } from "@/app/api/search/route";
import { globalSearchService } from "@/services/globalSearchService";
import { useCallback, useEffect, useRef, useState } from "react";

// --- Types ---
export type FilterType = "all" | SearchResultType;

export interface GroupedResults {
    workspaces: SearchResult[];
    folders: SearchResult[];
    titleFiles: SearchResult[];
    contentFiles: SearchResult[];
    total: number;
}

const EMPTY_RESULTS: GroupedResults = {
    workspaces: [],
    folders: [],
    titleFiles: [],
    contentFiles: [],
    total: 0,
};

// --- Recent history (localStorage) ---

const RECENT_KEY = "studysprout_search_recent";
const MAX_RECENT = 0;

function loadRecent(): SearchResult[]{
    if(typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch (error) {
        return [];
    }
}

function saveRecent(item: SearchResult){
    if(typeof window === "undefined") return;
    try {
        const prev = loadRecent().filter((r) => r._id !== item._id);
        localStorage.setItem(
            RECENT_KEY,
            JSON.stringify([item, ...prev].slice(0, MAX_RECENT))
        );
    } catch{}
}

export function useGlobalSearch(){
    const [ open, setOpen ] = useState(false);
    const [ query, setQuery ] = useState("");
    const [ filter, setFilter ] = useState<FilterType>("all");
    const [ results, setResults ] = useState<GroupedResults>(EMPTY_RESULTS);
    const [ recentItems, setRecentItems ] = useState<SearchResult[]>([]);
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);

    // Refs - don't trigger re-renders
    const debouceTimer = useRef<NodeJS.Timeout | null>(null);
    const abortController = useRef<AbortController | null>(null);
    // In-memory cache: query string -> GroupedResults
    const cache = useRef<Map<string, GroupedResults>>(new Map());

    // Reset everything when palette closes
    useEffect(() => {
        if(!open) {
            setQuery("");
            setResults(EMPTY_RESULTS);
            setError(null);
            setLoading(false);
            cache.current.clear(); //clear cache between sessions
            if(debouceTimer.current) clearTimeout(debouceTimer.current);
            if(abortController.current) abortController.current.abort();
        }else{
            setRecentItems(loadRecent());
        }
    },[open]);

    // Main search effect
    useEffect(() => {
        const q = query.trim();

        // clear any pending timer
        if(debouceTimer.current) clearTimeout(debouceTimer.current);

        // Guard 1: minimum 2 characters
        if(q.length < 2){
            setResults(EMPTY_RESULTS);
            setLoading(false);
            return;
        }

        const cacheKey = `${q}::${filter}`;

        // Guard 2: cache hit - no API call
        if(cache.current.has(cacheKey)){
            setResults(cache.current.get(cacheKey)!);
            setLoading(false);
            return;
        }

        // show loading immediately so the UI feels responsive
        setLoading(true);

        // Guard 3: debounce - wait 300ms before firing
        debouceTimer.current = setTimeout(async () => {
            // Guard 4: abort previous in-flight request
            if(abortController.current){
                abortController.current.abort();
            }
            abortController.current = new AbortController();

            try {
                const raw = await globalSearchService(
                    { q, type: filter === "all" ? "all" : filter },
                    abortController.current.signal
                );

                const grouped: GroupedResults = {
                    workspaces: raw.filter((r) => r.type === "workspace"),
                    folders: raw.filter((r) => r.type === "folder"),
                    titleFiles: raw.filter((r) => r.type === "file" && !r.matchedInContent),
                    contentFiles: raw.filter((r) => r.type === "file" && r.matchedInContent),
                    total: raw.length, 
                };

                // Store in cache
                cache.current.set(cacheKey, grouped);
                setResults(grouped);
                setError(null);
            } catch (error: any) {
                // Ignore abort errors- they're intentional
                if(error?.code === "ERROR_CANCELLED" || error?.name === "AbortError") return;
                setError("Search failed. Try again.");
                console.error("[useGlobalSearch] Failed: ",error);
            }finally{
                setLoading(false);
            }
        }, 300);

        return () => {
            if(debouceTimer.current) clearTimeout(debouceTimer.current);
        };
    },[
        query,
        filter,
    ]);

    // Keyboard shortcut: cmd/ctrl + k
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if((e.metaKey || e.ctrlKey) && e.key === "k"){
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    },[]);

    // Select an item
    const onSelect = useCallback((item: SearchResult) => {
        saveRecent(item);
        setRecentItems(loadRecent());
        setOpen(false);
    },[]);

    const clearRecent = useCallback(() => {
        localStorage.removeItem(RECENT_KEY);
        setRecentItems([]);
    },[]);

    return {
        open, setOpen,
        query, setQuery,
        filter, setFilter,
        results,
        recentItems,
        loading,
        error,
        hasQuery: query.trim().length >= 2,
        onSelect,
        clearRecent,
    };
}