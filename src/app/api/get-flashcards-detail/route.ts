/**
 * GET /api/get-flashcards-detail
 * 
 * This route is used to get the all the flashcards of a flashcard set
 * 
 * Responsibility:
 * - Validate request payload (setId).
 * - Find all flashcards.
 */
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FlashcardModel } from "@/model";

export async function GET(request: Request){
    await dbConnect();

     const { searchParams } = new URL(request.url)
        const queryParams = {
            setId: searchParams.get('setId')
        }
    
        if(!queryParams){
            return errorResponse(
                "No set id present",
                401,
                401
            )
        }
    
        const setId = queryParams.setId;
        try {
            const flashcards = await FlashcardModel.find({ parentSetId: setId});

            if(!flashcards){
                errorResponse(
                    "No flashcards found",
                    404,
                    404
                )
            }

            return successResponse(
                "Successfully fetched flashcards",
                flashcards,
                200,
                200
            )
        } catch (error) {
            console.warn("[FlashcardSetServices] Failed to get flashcards due to following error: ",error);
            return errorResponse(
                "Failed to get flashcards",
                500,
                500
            )
        }
}