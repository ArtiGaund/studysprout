/**
 * Manages flashcard SRS updating
 */

import { updateFlashcardSRSService } from "@/services/flashcardServices";
import { updateFlashcard } from "@/store/slices/flashcardSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";


export function useFlashcardSRS(){
    const [ loading, setLoading ] = useState(false);

    const dispatch = useDispatch();
    const rateCard = async (cardId: string, rating: string ) => {
        setLoading(true);
        try {
            const updateCard = await updateFlashcardSRSService(cardId, rating);
            if(!updateCard){
                console.log("[useFlashcardSRS] updateFlashcardSRSService failed");
            }
            dispatch(updateFlashcard(updateCard));
            return updateCard;
        } catch (error) {
            console.warn("[useFlashcardSRS] Error updating SRS: ",error);
            throw error;
        }finally{
            setLoading(false);
        }
    }

    return {
        rateCard,
        loading
    }
}