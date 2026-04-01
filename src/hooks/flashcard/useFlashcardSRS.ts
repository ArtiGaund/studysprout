/**
 * @hook useFlashcardSRS
 * @description A specialized utility hook for managing the Spaced Repetition System (SRS) logic.
 * * ARCHITECTURAL VALUE:
 * 1. Single Responsibility: Focused entirely on the feedback loop between the user's performance and the algorithm.
 * 2. Algorithmic Sync: Synchronizes the calculated 'progress' (Ease Factor, Interval, Step) back to the Redux store.
 * 3. Atomic Updates: Performs targeted card updates within a specific set, ensuring the UI reflects the next review date immediately.
 */
import { updateFlashcardSRSService } from "@/services/flashcardServices";
import { updateFlashcard } from "@/store/slices/flashcardSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";


export function useFlashcardSRS(){
    const [ loading, setLoading ] = useState(false);

    const dispatch = useDispatch();

    /**
     * @method rateCard
     * Processes a user's self-assessment (e.g., 'Again', 'Hard', 'Good', 'Easy').
     * The backend calculates the new SRS metadata, which is then persisted to the store.
     */
    const rateCard = async (cardId: string, rating: string ) => {
        setLoading(true);
        try {
            const response = await updateFlashcardSRSService(cardId, rating);
            console.log("[useFlashcardSRS] rateCard response: ",rateCard);
            if(!response){
                console.warn("[useFlashcardSRS] response not found in SRS update");
            }
            if(response?.success){
                const { progress, parentSetId } = response.data;
                dispatch(updateFlashcard({
                setId: parentSetId,
                card: {
                    _id: cardId,
                    progress: progress
                }
            }));
           
            }
             return response;
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