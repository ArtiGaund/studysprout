/**
 * Manages flashcard generation, deletion, reset + overwrite modal logic
 * Wraps backend services and sync results into Redux
 */


import { useToast } from "@/components/ui/use-toast";
import { deleteFlashcardSetService, generateFlashcardsService, GenerationPayload, resetFlashcardService, updateSingleOutdatedFlashcardService } from "@/services/flashcardServices";
import { addSet, removeSet } from "@/store/slices/flashcardSetSlice";
import { resetSingleFlashcard } from "@/store/slices/flashcardSlice";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { updateFlashcard } from "@/store/slices/flashcardSlice";

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
    const [ regenerateSingleFlashcard, setRegenerateSingleFlashcard  ] = useState(false);

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
            const allFlashcards = result.data.flashcards;
            if(newSet){
                dispatch(addSet({
                    _id: newSet._id,
                    title: newSet.title,
                    icon: newSet.icon ?? "",

                    workspaceId: newSet.workspaceId,
                    folderId: newSet.folderId,
                    resourceId: newSet.resourceId,
                    resourceType: newSet.resourceType,

                    totalCards: newSet.totalCards,
                    dueCount: newSet.totalCards,
                    cards: allFlashcards,
                    cardCount: allFlashcards.length,
                    desiredTypes: newSet.desiredTypes,
                    sourceSnapshot: newSet.sourceSnapshot,
                    isOutdated: newSet.isOutdated,
                    updatedAt: newSet.updatedAt
                }));
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
    const updateSingleFlashcard = useCallback(async (flashcardId: string ) => {
        setRegenerateSingleFlashcard(true);
        try {
            const result = await updateSingleOutdatedFlashcardService(flashcardId);
            if(!result || !result.success){
                toast({
                    title: "Failed",
                    description: "Something went wrong, result is not success",
                })
                return result;
            }
            dispatch(updateFlashcard({
                setId: result.data.flashcard.parentSetId,
                card: result.data.flashcard
            }))

            // console.log("[useFlashcardGenerator] redux after update: ",
            //     store.getState().flashcard.cardsBySet[])
            toast({
                title: "Success",
                description: "Successfully reset flashcard",
            })
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
            setRegenerateSingleFlashcard(false);
        }
    },[
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
        regenerateSingleFlashcard,
        updateSingleFlashcard,

        // modal state + controls
        showOverwriteModal,
        existingSetId,
        closeOverwriteModal,
    }
}