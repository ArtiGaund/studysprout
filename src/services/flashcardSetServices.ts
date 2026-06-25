/**
 * @module FlashcardSetServices
 * @description specialized API layer for managing Flashcard Set metadata and aggregate operations.
 * * KEY ARCHITECTURAL FEATURES:
 * 1. Resource-Based Routing: Adheres to RESTful standards using `/api/flashcard-set/[id]` 
 * for targeted resource retrieval.
 * 2. Workspace Scoping: Efficiently fetches collections filtered by `workspaceId`, 
 * supporting multi-tenant data isolation.
 * 3. Batch AI Re-triggering: Implements `regenerateFlashcardSetService` to allow 
 * users to refresh an entire set when source documents undergo major revisions.
 * 4. Error Propagation: Uses consistent `try/catch` blocks that re-throw errors, 
 * allowing the UI hooks to handle user-facing notifications via Toasts.
 */
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;

/**
 * @method getFlashcardSetService
 * @description Retrieves all flashcard sets associated with a specific workspace.
 * Essential for populating the "Flashcard Library" or sidebar views.
 */
export async function getFlashcardSetService(workspaceId: string){
    try {
        const relativePath = `/api/get-flashcard-sets?workspaceId=${workspaceId}`;
        const url = `${BASE_URL}${relativePath}`
        const { data } = await axios.get(url);

        if(!data) throw new Error(data.message);
        return data.data;
    } catch (error) {
        console.error("[FlashcardSetServices] Failed to get flashcard sets due to following error: ",error);
        throw error;
    }
}

/**
 * @method getFlashcardSetDetailBySetIdService
 * @description Fetches deep metadata for a specific set, including configuration 
 * (desiredTypes) and last synchronization timestamps.
 */
export async function getFlashcardSetDetailBySetIdService(setId: string){
    try {
        // const relativePath = `/api/get-flashcard-set-details?setId=${setId}`;
        const relativePath = `/api/flashcard-set/${setId}`;
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
 * @method regenerateFlashcardSetService
 * @description Triggers a full AI re-scan of the source document.
 * This is a 'Heavy' operation that typically results in an overwrite or update of all cards in the set.
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

export async function getFlashcardSetOverviewService(
    resourceId: string,
    resourceType: string,
    workspaceId: string,
): Promise<{
    success: boolean;
    data?: any;
    message?: string;
    statusCode?: number;
}>{
    try {
        const relativePath = `/api/flashcard-set`;
        const url = `${BASE_URL}${relativePath}`
        
        const { data } = await axios.get(url,{ 
            params: { 
                resourceId,
                resourceType,
                workspaceId,
             },
         });
        if(!data.success || !data.data) return {
            success: false,
            message: data.message,
            statusCode: data.statusCode,
        }
        
        return {
            success: true,
            data: data.data,
            statusCode: data.statusCode,
        }
    } catch (error: any) {
        console.error("[GetFlashcardSetOverviewService] Failed: ",error.message);
        return {
            success: false,
            message: error.message ?? "[GetFlashcardSetOverviewService] Internal Server Error",
            statusCode: error.statusCode,
        }
    }
}

export async function getFlashcardUsageService(workspaceId: string | undefined){
    try {
        const relativePath = `/api/workspace/${workspaceId}/usage`;
        const url = `${BASE_URL}${relativePath}`;

        const { data } = await axios.get(url);

        if(!data) throw new Error(data.message);
        return data.data;        
    } catch (error: any) {
        console.error("[flashcardSetService] getFlashcardUsageService Failed: ",error);
        return {
            success: false,
            message: error.message ?? "[flashcardSetService] Internal server error in getFlashcardUsageService",
            statusCode: error.statusCode,
        };
    }
}