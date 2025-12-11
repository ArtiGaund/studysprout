/** 
 * Flashcard generation service.
 * 
 *  - Sends a POST request to `/api/generate-flashcards`
 *  - Normalizes backend errors into thrown JS error
 *  - Does not contain UI rendering logic
 * **/

import axios, { AxiosError } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
/** Payload sent to the flashcard generation API */
export interface GenerationPayload{
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
 * Requests AI-generated flashcards for a specific file/folder/workspace.
 * 
 * @param payload - Details about the resource and the types/amount of cards to generate
 * @returns A normalized GenerationResponse object
 * 
 * @throws Error - Backend failure message (success: false)
 */
export async function generateFlashcardsService(payload: GenerationPayload): Promise<GenerationResponse> {
   try{
    const relativePath =  `/api/generate-flashcard-set`;
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
 * Deletes a flashcard set
 * 
 * @param setId - The id of the flashcard set
 * @returns - The response from the backend
 * 
 * @throws Error    - Backend failure message
 */
export async function deleteFlashcardSetService(setId: string){
    try {
        const relativePath = `/api/delete-flashcard-set?setId=${setId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.delete(url);
        return data;
    } catch (error) {
        console.warn("[FlashcardServices] Failed to delete flashcard set due to following error: ",error);
        throw error;
    }
}

/**
 *  Updates the SRs of a flashcard
 * 
 * @param cardId - The id of the flashcard
 * @param rating - The rating of the flashcard
 * @returns - The response from the backend
 * 
 * @throws Error    - Backend failure message
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
 * Resets a flashcard
 * 
 * @param cardId - The id of the flashcard
 * @returns - The response from the backend
 * 
 * @throws Error    - Backend failure message
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