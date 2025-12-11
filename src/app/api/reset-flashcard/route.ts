/**
 * POST /api/reset-flashcard
 * 
 * This route is used to reset a flashcard
 * 
 * Responsibility:
 * - Validate request payload (cardId).
 * - Will reset the SRS of the flashcard.
 */
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FlashcardModel } from "@/model";

export async function POST(request: Request){
    await dbConnect();
    const { searchParams} = new URL(request.url);
    const queryParams = {
        cardId: searchParams.get('cardId')
    }

    if(!queryParams || !queryParams.cardId){
        return errorResponse(
            "No card id present",
            401,
            401
        )
    }

    const cardId = queryParams.cardId;
    try {
        
        const card = await FlashcardModel.findById(cardId);

        if(!card){
            return errorResponse(
                "No card found",
                404,
                404
            )
        }

        const today = new Date();
        card.interval = 1;
        card.difficulty = 2.5;
        card.repetition = 0;
        card.dueDate = today;
        card.lastReviewed = undefined;

        await card.save();


        return successResponse(
            "Successfully reset flashcard",
            200,
            200
        )

    } catch (error) {
        console.warn("[Reset Flashcard route] Error resetting flashcard", error);
        return errorResponse(
            "Error resetting flashcard",
            500,
            500
        )
    }
}