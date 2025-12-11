/**
 * POST /api/flashcard-review
 * 
 * This route is used to update the SRS of a flashcard
 * 
 * Responsibility:
 * - Validate request payload (cardId, rating).
 * - Find the flashcard.
 * - Update the SRS of the flashcard.
 * 
 * Notes:
 * - This route is used to update the SRS of a flashcard
 * - Error responses use the unified API response helpers.
 * - 409 error code is different from any other error code, its to handle existing flashcard set.
 
 */

import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { updateSRS } from "@/lib/srs/updateSRS";
export async function POST(request: Request){
    await dbConnect();
    const { rating } = await request.json();
     const { searchParams } = new URL(request.url)
            const queryParams = {
                cardId: searchParams.get('cardId')
            }
            
            // 1. Validate request payload
            if(!queryParams){
                return errorResponse(
                    "No card id present",
                    401,
                    401
                )
            }
        
            const cardId = queryParams.cardId;

            if(!cardId){
                return errorResponse(
                    "No card id present",
                    401,
                    401
                )
            }
            try {
                // 2. Find the flashcard and update the SRS
                const updatedCard = await updateSRS(cardId, rating);

                if(!updatedCard){
                    return errorResponse(
                        "Card not updated",
                        404,
                        404
                    )
                }

                return successResponse(
                    "Successfully updated card",
                    updatedCard,
                    200,
                    200
                )
            } catch (error) {
                console.warn("[flashcard review route] Error updating card", error);
                return errorResponse("Error updating card", 500, 500);
            }
}