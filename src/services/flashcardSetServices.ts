/**
 * Flashcard Set generation service.
 * 
 * - Sends a GET request to `/api/get-flashcard-sets`
 * - Normalizes backend errors into thrown JS error
 * - Does not contain UI rendering logic
 * 
 */

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 *  Get all flashcard sets for the workspace
 * 
 * @param workspaceId - The id of the workspace
 * @returns - set of flashcard sets
 * 
 * @throws Error    - Backend failure message
 */
export async function getFlashcardSetService(workspaceId: string){
    try {
        const relativePath = `/api/get-flashcard-sets?workspaceId=${workspaceId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);

        if(!data) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.log("[FlashcardSetServices] Failed to get flashcard sets due to following error: ",error);
        throw error;
    }
}

/**
 * Get the details of a flashcard set
 * 
 * @param setId - The id of the flashcard set
 * @returns - details of the flashcard set
 * 
 * @throws Error    - Backend failure message
 */
export async function getFlashcardSetDetailBySetIdService(setId: string){
    try {
        const relativePath = `/api/get-flashcard-set-details?setId=${setId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
        if(!data) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FlashcardSetServices] Failed to get flashcard set details due to following error: ",error);
        throw error;
    }
}

/**
 * Get all the flashcards of a flashcard set
 * 
 * @param setId - The id of the flashcard set
 * @returns - array of flashcards
 * 
 * @throws Error    - Backend failure message
 */
export async function getFlashcardsBySetIdService(setId: string){
    try {
        const relativePath = `/api/get-flashcards-detail?setId=${setId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);
        if(!data) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FlashcardSetServices] Failed to get flashcards due to following error: ",error);
        throw error
    }
}

/**
 * Regenerate flashcard set
 * 
 * @param setId - The id of the flashcard set
 * @returns - regenerate flashcard set
 * 
 * @throws Error - Backend failure message
 */

export async function regenerateFlashcardSetService(
    setId: string,
){
    try {
        const relativePath = `/api/flashcard-set/${setId}/regenerate`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.post(url);
        if(!data) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.warn("[FlashcardSetServices] Failed to regenerate flashcard set due to following error: ",error);
        throw error
    }
}