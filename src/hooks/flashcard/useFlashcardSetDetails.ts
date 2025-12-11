/**
 * Manages flashcard set fetching
 * 
 */

import { getFlashcardsBySetIdService, getFlashcardSetDetailBySetIdService } from "@/services/flashcardSetServices";
import { updateSingleSet } from "@/store/slices/flashcardSetSlice";
import { setFlashcardsForSet } from "@/store/slices/flashcardSlice";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useFlashcardSetDetails(setId?: string | null){
    const [ loading, setLoading ] = useState(false);
    const dispatch = useDispatch();
    const set = useSelector(
        (state: RootState) => state.flashcardSet.sets.find((s: any) => s._id === setId)
    );

    const EMPTY: any[] = [];
    const cards = useSelector((state: RootState) => {
        const map = state.flashcard.cardsBySet;
        return map && map[setId!] ? map[setId!] : EMPTY;
    });

    
    useEffect(() => {
       if(!setId) return;
       const fetchDetails = async () => {
        setLoading(true);
        try {
            const setResponse = await getFlashcardSetDetailBySetIdService(setId);
            const cardResponse = await getFlashcardsBySetIdService(setId);
        
             dispatch(setFlashcardsForSet({ setId, cards: cardResponse }));

            const dueCount = cardResponse.filter(
                (c: any) => new Date(c.dueDate) <= new Date()
            ).length;
            
            const totalCards = cardResponse.length;

            dispatch(updateSingleSet({
                ...setResponse,
                dueCount,
                totalCards,
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
        dispatch
    ])

    return {
        set,
        cards,
        loading,
    }
}