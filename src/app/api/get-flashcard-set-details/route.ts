/**
 * GET /api/get-flashcard-set-details
 * 
 * This route is used to get the details of a flashcard set
 * 
 * Responsibility:
 * - Validate request payload (setId).
 * - Find the flashcard set.
 * 
 * Notes:
 * - This route is used to get the details of a flashcard set
 * 
 */
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FlashcardSetModel } from "@/model";

export async function GET(request: Request) {
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
        const set = await FlashcardSetModel.findById(setId);
        
        if(!set){
            return errorResponse(
                "No set found",
                404,
                404
            )
        }

        return successResponse(
            "Successfully fetched flashcard set",
            set,
            200,
            200
        )
    } catch (error) {
        console.warn("Error while fetching flashcard set",error);
        return errorResponse(
            "Error while fetching flashcard set",
            500,
            500
        )
    }
}