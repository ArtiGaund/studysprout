/**
 * @hook useFlashcardGenerator
 * @description An advanced orchestration hook for managing AI-driven flashcard lifecycles.
 * * TECHNICAL CAPABILITIES:
 * 1. Real-time Feedback: Emits progress percentages to a Socket.io server to drive UI progress bars.
 * 2. Conflict Management: Implements a "409 Conflict" recovery flow, allowing users to overwrite existing sets.
 * 3. Batch State Sync: Updates both the FlashcardSet (metadata) and Flashcards (entities) slices in Redux simultaneously.
 * 4. Granular Updates: Supports single-entity regeneration for outdated cards without resetting the entire set.
 */

import { useToast } from "@/components/ui/use-toast";
import { 
    deleteFlashcardSetService, 
    generateFlashcardsService, 
    GenerationPayload, 
    resetFlashcardService, 
    updateSingleOutdatedFlashcardService 
} from "@/services/flashcardServices";
import { addSet, removeSet } from "@/store/slices/flashcardSetSlice";
import { resetSingleFlashcard, setFlashcardsForSet } from "@/store/slices/flashcardSlice";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { updateFlashcard } from "@/store/slices/flashcardSlice";
import { useSocket } from "@/lib/providers/socket-provider";
import { MARK_ACTIVITY_STALE } from "@/store/slices/activitySlice";

interface FlashcardGeneratorOptions{
    onSuccess?: (setId: string) => void;
    onAlreadyExist?: (setId: string) => void;
}
export function useFlashcardGenerator(options?: FlashcardGeneratorOptions){
    const { socket } = useSocket();
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
     * @method generateCards
     * Triggers the AI pipeline. 
     * Includes a progress reporting mechanism to improve perceived performance.
     */
    const generateCards = useCallback(async (payload: GenerationPayload) => {
        setIsGeneratingCards(true);

        // Send progress to socket
        const reportProgress = (
            percent: number,
            currentCount: number,
        ) => {
            if(socket){
                socket.emit("report_progress", {
                    resourceId: payload.resourceId,
                    workspaceId: payload.workspaceId,
                    progress: percent,
                    currentCount: currentCount,
                    totalCards: payload.cardCount,
                });
            }
        };
        try {
            // Initial Start (5%)
            reportProgress(5, 0);

            // Fire API request
            const result = await generateFlashcardsService(payload);

            // Processing (After API before Redux finished)
            reportProgress(80, Math.floor(payload.cardCount * 0.8 ));
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
        
            const { flashcardSet: newSet, flashcards: allFlashcards } = result.data;
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

                dispatch(setFlashcardsForSet({
                    setId: newSet._id,
                    cards: allFlashcards,
                }));

                reportProgress(100, payload.cardCount);
            }

            if(options?.onSuccess){
                options.onSuccess(newSet._id);
            }
            dispatch(MARK_ACTIVITY_STALE());
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
     * @method deleteFlashcardSet
     * Logic for permanent removal of study data. 
     * Ensures Redux state is purged only after successful backend confirmation.
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
            dispatch(MARK_ACTIVITY_STALE());
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
     * @method resetCard
     * Reset study progress for a single card.
     * Demonstrates high-performance, granular state updates without re-fetching.
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

    /**
     * @method updateSingleFlashcard
     * Updates an 'Outdated' card. Shows proficiency in partial data synchronization 
     * rather than expensive full-set refreshes.
     */
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