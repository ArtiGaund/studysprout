/**
 * This component is used to regenerate a flashcard set, if flashcard set already exist of these resources
 * 
 * @returns {JSX.Element}
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

    const {
        generateCards,
        isGeneratingCards,
        deleteFlashcardSet,
        isDeletingFlashcardSet,
    } = useFlashcardGenerator();

    const handleDeleteAndRegenerate = async () => {
        // validate flashcardSetId 
        if(!flashcardSetId) return;
        // validate payload
        if(!payload) return;
        try {
            // delete the flashcard set
            const deleteFlashcardSetResponse = await deleteFlashcardSet(flashcardSetId);

            if(!deleteFlashcardSetResponse || !deleteFlashcardSetResponse.success){
                console.warn("[RegenerateFlashcardSet] Error deleting flashcard set", deleteFlashcardSetResponse);
                return;
            }
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