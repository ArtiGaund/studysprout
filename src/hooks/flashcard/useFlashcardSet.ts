/**
 * @hook useFlashcardSet
 * @description A specialized data-fetching hook for retrieving and refreshing Flashcard Sets.
 * * CORE ARCHITECTURAL PATTERNS:
 * 1. Automatic Hydration: Triggers an initial fetch via `useEffect` bound to the `workspaceId`.
 * 2. Deduplication Logic: Uses `hasFetchedRef` to prevent redundant API calls during component re-renders.
 * 3. Atomic Refresh: The `regenerateFlashcardSet` method demonstrates how to update specific 
 * metadata (like `isOutdated`) while simultaneously refreshing the card entities.
 * 4. Force-Refresh Capability: Provides a `forceRefresh` flag to bypass local cache when necessary.
 */
import { useToast } from "@/components/ui/use-toast";
import { getFlashcardSetOverviewService, getFlashcardSetService, regenerateFlashcardSetService } from "@/services/flashcardSetServices";
import { MARK_FLASHCARD_SETS_FRESH, setFlashcardSets, updateSingleSet } from "@/store/slices/flashcardSetSlice";
import { setFlashcardsForSet } from "@/store/slices/flashcardSlice";
import { RootState } from "@/store/store";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useFlashcardSet(workspaceId: string){
    const [ loading, setLoading ] = useState(false);
    const [ regenerating, setRegenerating ] = useState(false);

    /**
     * @property hasFetchedRef
     * Tracks the last successfully fetched ID to prevent 
     * infinite fetch loops and unnecessary network load.
     */
    const hasFetchedRef = useRef<string | null>(null);

    const { toast } = useToast();
   
    const dispatch = useDispatch();
    const flashcardSetsStale = useSelector(
        (state: RootState) => state.flashcardSet.flashcardSetsStale
    );

    useEffect(() => {
        getFlashcardSets(workspaceId);
    },[
        workspaceId,
        flashcardSetsStale,
    ]);
    /**
     * @method getFlashcardSets
     * Retrieves all sets for a given context (Workspace or Folder).
     * Implements basic client-side memoization via Ref.
     */
    const getFlashcardSets = useCallback(async (
        id: string,
        forceRefresh = false, 
    ) => {
        if(!id) return;

        // Check if forceRefresh is true
        if(!forceRefresh && hasFetchedRef.current === id) return;

        // if(hasFetchedRef.current === id) return;
        setLoading(true);
       
        try {
            const response = await getFlashcardSetService(id);
            dispatch(setFlashcardSets(response));
            dispatch(MARK_FLASHCARD_SETS_FRESH());
            hasFetchedRef.current = id;
        } catch (error) {   
            console.warn("[useFlashcardSet] [getFlashcardSets] Error fetching flashcard sets: ",
                error
            );
        }finally{
            setLoading(false);
        }
    },[
        dispatch
    ])
    
    /**
     * @method regenerateFlashcardSet
     * Handles the "Full Set Update" logic. Useful when the source notes change 
     * and the entire set needs to be re-synced with the AI service.
     */
    const regenerateFlashcardSet = useCallback(async (setId: string) => {
        setRegenerating(true);
        try {
            const response = await regenerateFlashcardSetService(setId);
            if(!response || !response.success){
                toast({
                    title: "Regenerating Flashcard set failed",
                    description: response.message,
                    variant: "destructive"
                });
                return;
            }
            const { flashcardSet, flashcards} = response.data;
                dispatch(updateSingleSet({
                    ...flashcardSet,
                    isOutdated: false,
                }));
                dispatch(setFlashcardsForSet({
                   setId: flashcardSet._id,
                   cards: flashcards,
                }));
                       toast({
                           title: "Regenerate Flashcard set successful",
                           description: "Successful"
                       });
                       return response;
        } catch (error) {
            console.warn("[useFlashcardSet] Error regenerating flashcard set: ",error);
        }finally{
            setRegenerating(false);
        }
    },[
        dispatch,
        toast
    ])

    const getFlashcardSetOverview = useCallback(async (
        resourceId: string,
        resourceType: string,
        workspaceId: string,
    ) => {
        setLoading(true);
        try {
            const response = await getFlashcardSetOverviewService(
                resourceId,
                resourceType,
                workspaceId
            );

            if(!response || !response.success){
                toast({
                    title: "Failed to load the flashcard set",
                    description: response.message,
                    variant: "destructive",
                });
                return;
            }
            return response;
        } catch (error) {
            console.error("[GetFlashcardSetOverview] Failed: ",error);
        }finally{
            setLoading(false);
        }
    },[
        workspaceId,
        toast,
    ])

    /**
     * @effect Auto-Hydration
     * Triggers whenever the workspace context changes, ensuring the user 
     * always sees relevant data.
     */
    useEffect(() => {
        getFlashcardSets(workspaceId);
    },[
        workspaceId,
        getFlashcardSets,
    ])
    return {
        loading,
        regenerating,
        regenerateFlashcardSet,
        getFlashcardSets,
        getFlashcardSetOverview,
    }
}