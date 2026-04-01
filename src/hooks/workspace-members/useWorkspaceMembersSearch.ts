/**
 * @hook useWorkspaceMembersSearch
 * @description A performance-optimized hook for searching platform users to invite 
 * them to a workspace.
 * * PERFORMANCE FEATURES:
 * 1. Custom Debouncing: Implements a 300ms delay to throttle outgoing API requests.
 * 3. Threshold Guard: Only triggers a search when the query exceeds 2 characters.
 * 2. Cleanup Logic: Uses `clearTimeout` to prevent memory leaks and race conditions 
 * if the user types rapidly.
 * 4. State Management: Provides granular `loading` and `results` states for a responsive UI.
 */

import { SearchUsers } from "@/services/workspaceMemberServices";
import { UserSearch } from "@/types/user-search.type";
import { useRef, useState } from "react";

export function useWorkspaceMembersSearch(){
    const [ query, setQuery ] = useState("");
    const [ results, setResults ] = useState<UserSearch[]>([]);
    const [ loading, setLoading ] = useState(false);

    // useRef is used for the timer to persist its identity across re-renders 
    // without triggering new renders itself.
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * @method searchUsers
     * Handles the input change event and manages the debounce lifecycle.
     */
    const searchUsers = (value: string) => {
        setQuery(value);

        // 1. Clear existing timer to reset the 300ms window
        if(debounceRef.current){
            clearTimeout(debounceRef.current);
        }

        // 2. Initialize a new timer for the search execution
        debounceRef.current = setTimeout(async () => {
            if(value.trim().length < 2){
                setResults([]);
                return;
            }

            setLoading(true);
            // 3. Fire the de-identified search service
            const result = await SearchUsers(value);

            setResults(result ?? []);
            setLoading(false);
        }, 300);
    };

    return {
        query,
        results,
        loading,
        searchUsers,
    }
}