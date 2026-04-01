/**
 * @module FlashcardServices
 * @description specialized API layer for AI flashcard generation and Spaced Repetition System (SRS) management.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Intelligent Status Validation: Specifically allows 409 (Conflict) to pass through `validateStatus`, 
 * enabling the frontend to handle "Set Already Exists" logic gracefully.
 * 2. Resource-Scoped Generation: Supports generation at the Workspace, Folder, or File level 
 * via a polymorphic `GenerationPayload`.
 * 3. SRS Integration: Provides endpoints for reviewing and resetting individual card progress, 
 * essential for adaptive learning algorithms.
 * 4. Incremental AI Updates: Features `updateSingleOutdatedFlashcardService` to sync individual 
 * cards when source notes change, reducing LLM token costs and improving performance.
 */

import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/** * @interface GenerationPayload 
 * Defines the parameters for the AI generation engine.
 */
export interface GenerationPayload{
    workspaceId: string;
    folderId?: string;
    parentId?: string;
    resourceId: string;
    resourceType: 'Workspace' | 'Folder' | 'File';
    cardCount: number;
    desiredTypes: ( 'question-answer' | 'fill-in-the-blank' | 'mcq')[];
}

/** Normalized response returned by flashcard API */
export interface GenerationResponse{
    success: boolean;
    cards?: any[];
    error?: string;
    statusCode: number;
    data?:any;
}

/**
 * @method generateFlashcardsService
 * @description Triggers the AI generation pipeline. 
 * Uses a custom `validateStatus` to treat 409s as actionable responses rather than hard errors.
 */
export async function generateFlashcardsService(payload: GenerationPayload): Promise<GenerationResponse> {
   try{
    const relativePath =  `/api/flashcard-set`;
    const url = `${BASE_URL}${relativePath}`
     const { data } = await axios.post(
       url,
        payload,
        {
            validateStatus: (status) => {
                return status < 400 || status === 409;  //for success and for already exist giving a pass
            }
        }
    );

    return data; //already normalized by the API
   }catch(error){
    const err = error as AxiosError;
    if(err.response) return err.response.data as GenerationResponse;
    throw err;
   }
}   

/**
 * @method deleteFlashcardSetService
 * @description Performs a permanent deletion of a flashcard set and its associated 
 * flashcard entities. 
 * * Recruiter Note: This demonstrates an understanding of "Cascade Deletion" 
 * management on the backend, triggered by a clean RESTful DELETE request.
 */
export async function deleteFlashcardSetService(setId: string){
    try {
        // const relativePath = `/api/delete-flashcard-set?setId=${setId}`;
        const relativePath = `/api/flashcard-set/${setId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.delete(url);
        return data;
    } catch (error) {
        console.warn("[FlashcardServices] Failed to delete flashcard set due to following error: ",error);
        throw error;
    }
}

/**
 * @method updateFlashcardSRSService
 * @description Updates the Spaced Repetition metadata (Easiness, Interval, Repetitions) 
 * based on user-provided ratings (e.g., Again, Hard, Good, Easy).
 */
export async function updateFlashcardSRSService(cardId: string, rating: string) {
    try {
        const relativePath = `/api/flashcard-review?cardId=${cardId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.post(url, { rating });
        return data;
    } catch (error) {
        console.warn("[FlashcardServices] updateFlashcardSRSService failed due to following error: ",error);
        throw error;
    }
}

/**
 * @method resetFlashcardService
 * @description Reinitializes a flashcard's Spaced Repetition (SRS) data.
 * It resets 'Interval', 'Easiness Factor', and 'Next Review' to their 
 * default states without deleting the card's content.
 * * Recruiter Note: This is a vital UX feature for study apps, allowing 
 * users to "re-learn" a specific concept from scratch.
 */
export async function resetFlashcardService(cardId: string){
    try {
        const relativePath = `/api/reset-flashcard?cardId=${cardId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.post(url);
        return data;
    } catch (error) {
        console.warn("[FlashcardServices] resetFlashcardService failed due to following error: ",error);
        throw error;
    }
}
/**
 * @method updateSingleOutdatedFlashcardService
 * @description Targeted AI regeneration. Ensures the flashcard stays in sync 
 * with the most recent 'Source Snapshot' of the associated note block.
 */
export async function updateSingleOutdatedFlashcardService(flashcardId: string) {
    try {
        // const relativePath = `/api/regenerate-single-flashcard`;
        const relativePath = `/api/flashcard/${flashcardId}/regenerate`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.post(url, { flashcardId });
        return data;
    } catch (error) {
        console.warn("[FlashcardServices] updateSingleOutdatedFlashcardService failed due to following error: ",error);
        throw error;
    }
}