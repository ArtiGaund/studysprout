/**
 * @hook useFlashcardSetDetails
 * @description A specialized data-fetching hook for hydrating flashcard set metadata and associated card entities.
 * * ARCHITECTURAL STRENGTHS:
 * 1. State Synchronization: Coordinates updates between the Set (metadata) and Cards (content) slices.
 * 2. Derived Logic: Dynamically calculates 'dueCount' and 'totalCards' client-side based on Spaced Repetition (SRS) metadata.
 * 3. Reactive Refetching: Utilizes 'setId' and 'updatedAt' as dependency triggers to ensure data freshnees.
 * 4. Selector-Based Access: Efficiently pulls data from the Redux 'cardsBySet' map to prevent O(n) search operations.
 */

import { getFlashcardSetDetailBySetIdService } from "@/services/flashcardSetServices";
import { updateSingleSet } from "@/store/slices/flashcardSetSlice";
import { setFlashcardsForSet } from "@/store/slices/flashcardSlice";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useFlashcardSetDetails(setId?: string | null){
    const [ loading, setLoading ] = useState(!!setId);
    const dispatch = useDispatch();

    // --- Optimized Selectors ---
    // Accessing metadata from the normalized set slice
    const set = useSelector(
        (state: RootState) => state.flashcardSet.sets.find((s: any) => s._id === setId)
    );

    // Accessing card entities from a keyed map (cardsBySet) for O(1) lookups
    const EMPTY: any[] = [];
    const cards = useSelector((state: RootState) => {
        const map = state.flashcard.cardsBySet;
        return map && map[setId!] ? map[setId!] : EMPTY;
    });

    /**
     * @effect fetchDetails
     * Hydrates the store with the latest set data and computes SRS-related counters.
     */
    useEffect(() => {
       if(!setId) return;
       const fetchDetails = async () => {
        setLoading(true);
        try {
            const result = await getFlashcardSetDetailBySetIdService(setId);
            console.log("[useFlashcardSetDetails] result: ",result);
            
            const setResponse = result.set;
            const cardResponse = result.flashcards || [];
            // 1. Sync card entities to the flashcard slice
             dispatch(setFlashcardsForSet({ setId, cards: cardResponse }));

             // 2. Compute Derived Stats: Determine cards due for review (SRS logic)
            const dueCount = cardResponse.filter( (c: any) =>
            new Date(c.progress.dueDate) <= new Date()
            ).length;
            
            const totalCards = cardResponse.length;

            // 3. Update Set Metadata with computed totals and status
            dispatch(updateSingleSet({
                _id:setId,
                ...setResponse,
                dueCount,
                totalCards,
                isOutdated: setResponse.isOutdated,
            }));
           
        } catch (error) {
            console.warn("[useFlashcardSetDetails] Error fetching flashcard set details: ",error);
        }finally{
            setLoading(false);
        }
    }
    fetchDetails();
    },[
        setId,
        set?.updatedAt,
    ])

    return {
        set,
        cards,
        loading,
        setLoading,
    }
}