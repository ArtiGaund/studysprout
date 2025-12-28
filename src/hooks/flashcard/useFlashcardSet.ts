/**
 * Manages flashcard set fetching
 * 
 * Wraps backend services and sync results into Redux
 */

import { useToast } from "@/components/ui/use-toast";
import { getFlashcardSetService, regenerateFlashcardSetService } from "@/services/flashcardSetServices";
import { addSet, removeSet, setFlashcardSets, updateSingleSet } from "@/store/slices/flashcardSetSlice";
import { setFlashcardsForSet } from "@/store/slices/flashcardSlice";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";


export function useFlashcardSet(workspaceId: string){
    const [ loading, setLoading ] = useState(false);
    const [ regenerating, setRegenerating ] = useState(false);

    const { toast } = useToast();
   
    const dispatch = useDispatch();
    useEffect(() => {
        if(!workspaceId){
            console.log("[useFlashcardSet] workspaceId not provided, useEffect returned early.");
            return;
        }

        const fetchSets = async () => {
            setLoading(true);
            try {
                const response = await getFlashcardSetService(workspaceId);
                // setSets(response);
                dispatch(setFlashcardSets(response));
            } catch (error) {
                console.warn("[useFlashcardSet] Error fetching flashcard sets: ",error);
            }finally{
                setLoading(false);
            }
        }
        fetchSets();
    },[
        workspaceId,
        dispatch
    ])
    

    const regenerateFlashcardSet = useCallback(async (setId: string) => {
        setRegenerating(true);
        try {
            const response = await regenerateFlashcardSetService(setId);
            if(!response){
                toast({
                    title: "Regenerating Flashcard set failed",
                    description: response.message,
                    variant: "destructive"
                });
                return;
            }
            const newSet = response.data?.flashcardSet;
            if(newSet){
                dispatch(updateSingleSet(newSet));
                dispatch(setFlashcardsForSet({
                    setId: newSet._id,
                    cards: newSet.flashcards
                }))
            }
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

    return {
        loading,
        regenerating,
        regenerateFlashcardSet,
    }
}