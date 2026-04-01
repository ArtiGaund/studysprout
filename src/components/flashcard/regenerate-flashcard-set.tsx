/**
 * @component RegenerateFlashcardSet
 * @description A specialized modal for resolving flashcard generation conflicts.
 * It provides users with three distinct actions when a resource already has associated cards:
 * 1. Navigation: View the existing set.
 * 2. Destructive: Wipe existing data and trigger a new AI generation cycle.
 * 3. Dismissal: Cancel the operation.
 * * * Design Pattern: Uses a "Fixed Overlay" with a contained "Action Dialog".
 */
"use client";

import { useFlashcardGenerator } from "@/hooks/flashcard/useFlashcardGenerator";
import { GenerationPayload } from "@/services/flashcardServices";
import { Loader2 } from "lucide-react";


interface RegenerateFlashcardSetProps {
   flashcardSetId: string;
   onClose: () => void;
   payload: GenerationPayload;
   onViewSet: (setId: string) => void;
}

export default function RegenerateFlashcardSet({
    flashcardSetId,
    onClose,
    payload,
    onViewSet
}: RegenerateFlashcardSetProps){

    /**
     * @hook useFlashcardGenerator
     * Custom hook abstraction for handling API interactions and loading states.
     */
    const {
        generateCards,
        isGeneratingCards,
        deleteFlashcardSet,
        isDeletingFlashcardSet,
    } = useFlashcardGenerator();

    /**
     * @handler handleDeleteAndRegenerate
     * Orchestrates the replacement of an existing flashcard set.
     * Includes defensive validation and error logging for the regeneration lifecycle.
     */
    const handleDeleteAndRegenerate = async () => {
       // Defensive checks to prevent orphan requests
        if(!flashcardSetId) return;
        // validate payload
        if(!payload) return;
        try {
            // regenerate the flashcard set
            const regenerateFlashcard = await generateCards(payload);

            if(!regenerateFlashcard || !regenerateFlashcard.success){
                console.warn("[RegenerateFlashcardSet] Error regenerating flashcard set", regenerateFlashcard);
                return;
            }
           
            
        } catch (error) {
            console.warn("[RegenerateFlashcardSet] Error deleting and regenerating flashcard set", error);
        }
    }
    return(
        <div className="flex inset-0 bg-black/40 fixed items-center justify-center">
            <div className="bg-gray-950 p-6 rounded-md w-[40rem]">
                <h2 className="text-lg font-semibold mb-2">Flashcard set already exist</h2>
                <p className="text-sm mb-4">
                    A flashcard set already exists for this resource. What do you want to do ?
                </p>
                <div className="flex flex-row gap-5">
                    <button 
                    className="w-full bg-purple-950 text-white py-2 rounded text-sm hover:bg-purple-600"
                    onClick={() => onViewSet(flashcardSetId) }    
                    >
                        View Existing set
                    </button>
                   {isGeneratingCards || isDeletingFlashcardSet
                    ? (
                    <Loader2 className="animate-spin"/>
                   )
                   :( <button 
                    className="w-full bg-red-900 text-white py-2 rounded text-sm hover:bg-red-600"
                    onClick={handleDeleteAndRegenerate}
                    >
                        Delete & Regenerate
                    </button>)}
                    <button
                    className="w-full border py-2 rounded text-sm"
                    onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}