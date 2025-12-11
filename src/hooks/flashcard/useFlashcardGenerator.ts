/**
 * Manages flashcard generation, deletion, reset + overwrite modal logic
 * Wraps backend services and sync results into Redux
 */


import { useToast } from "@/components/ui/use-toast";
import { deleteFlashcardSetService, generateFlashcardsService, GenerationPayload, resetFlashcardService } from "@/services/flashcardServices";
import { addSet, removeSet } from "@/store/slices/flashcardSetSlice";
import { resetSingleFlashcard } from "@/store/slices/flashcardSlice";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

interface FlashcardGeneratorOptions{
    onSuccess?: (setId: string) => void;
    onAlreadyExist?: (setId: string) => void;
}
export function useFlashcardGenerator(options?: FlashcardGeneratorOptions){
    const { toast } = useToast();
    const dispatch = useDispatch();
    // UI + async state flags
    const [ isGeneratingCards, setIsGeneratingCards ] = useState(false);
    const [ isDeletingFlashcardSet, setIsDeletingFlashcardSet ] = useState(false);
    const [ reset, setReset ] = useState(false);

    // overwrite-flow state: used when a flashcard set already exists (409)
    const [ showOverwriteModal, setShowOverwiteModal ] = useState(false);
    const [ existingSetId, setExistingSetId ] = useState<string | null>(null);
 

    /**
     * Generates a new flashcard set from notes
     * - Handles overwrite flow (409)
     * - Writes newly created set to Redux
     * - Surfaces toast notifications for success/failure
     */
    const generateCards = useCallback(async (payload: GenerationPayload) => {
        setIsGeneratingCards(true);
        try {
            // Fire API request
            const result = await generateFlashcardsService(payload);
            if(!result || !result.success){
                if(result.statusCode === 409){ //flashcard already exist of these payload
                    // Open an model to ask user if they want to overwrite the flashcard
                    const existingSetId = result.data;
                    setExistingSetId(existingSetId);
                    setShowOverwiteModal(true);
                    
                    // Trigger callback if provided
                    options?.onAlreadyExist?.(existingSetId);

                    return result
                }
                    toast({
                        title: "Failed",
                        description: "Something went wrong, result is not success",
                    })
                    return result;
               
            }
            toast({
                title: "Success",
                description: "Successfully generated flashcards",
            })
        
            const newSet = result.data?.flashcardSet;
            if(newSet){
                dispatch(addSet(newSet));
            }

            if(options?.onSuccess){
                options.onSuccess(newSet._id);
            }
            return result;
        } catch (error) {
            console.log("[useFlashcardGenerator] Error generating flashcards: ",error);
            toast({
                title: "Failed",
                description: "Something went wrong, in catch block of useFlashcardGenerator",
            })
            return {
                success: false,
                error: error as string
            }
        }finally{   
            setIsGeneratingCards(false);
        }
    }, [
        toast,
        options,
        dispatch
    ])

    /**
     * Delete flashcard set and remove it from Redux
     */

    const deleteFlashcardSet = useCallback(async (setId: string) => {
        setIsDeletingFlashcardSet(true);
        try {
            const result = await deleteFlashcardSetService(setId);
            if(!result || !result.success){
                toast({
                    title: "Failed",
                    description: "Something went wrong, result is not success",
                })
                return result;
            }
            toast({
                title: "Success",
                description: "Successfully deleted flashcard set",
            })
            dispatch(removeSet({ setId }));
            return result;
        } catch (error) {
            console.warn("[useFlashcardGenerator] Error deleting flashcard set: ",error);
            toast({
                title: "Failed",
                description: "Something went wrong, in catch block of useFlashcardGenerator",
            })
            return {
                success: false,
                error: error as string
            }
        }finally{
            setIsDeletingFlashcardSet(false);
        }
    },[toast, dispatch])

    /**
     * Reset a single flashcard's progress and update Redux store
     */
    const resetCard = useCallback(async (cardId: string) => {
        setReset(true);
        try {
            const result = await resetFlashcardService(cardId);
            if(!result || !result.success){
                toast({
                    title: "Failed",
                    description: "Something went wrong, result is not success",
                })
               
                return result;
            }
            toast({
                title: "Success",
                description: "Successfully reset flashcard",
            })
            const parentSetId = result.data?.parentSetId;
             dispatch(resetSingleFlashcard({ cardId, setId: parentSetId }))
            return result;
        } catch (error) {
            console.warn("[useFlashcardGenerator] Error resetting flashcard: ",error);
            toast({
                title: "Failed",
                description: "Something went wrong, in catch block of useFlashcardGenerator",
            })
            return {
                success: false,
                error: error as string
            }
        }finally{
            setReset(false);
        }
    }, [
        toast,
        dispatch
    ])
    // helper to hide overwrite modal + clear stored set id
    const closeOverwriteModal = () => {
        setShowOverwiteModal(false);
        setExistingSetId(null);
    }

    return {
        generateCards,
        isGeneratingCards,
        isDeletingFlashcardSet,
        deleteFlashcardSet,
        resetCard,
        reset,

        // modal state + controls
        showOverwriteModal,
        existingSetId,
        closeOverwriteModal,
    }
}