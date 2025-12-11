/**
 * Manages flashcard set fetching
 * 
 * Wraps backend services and sync results into Redux
 */

import { getFlashcardSetService } from "@/services/flashcardSetServices";
import { setFlashcardSets } from "@/store/slices/flashcardSetSlice";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";


export function useFlashcardSet(workspaceId: string){
    const [ loading, setLoading ] = useState(false);
   
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

    return {
        loading
    }
}