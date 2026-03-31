/**
 * FLASHCARD REVIEW (SRS Update)
 * -----------------------------
 * Role: Records a user's study session and calculates the next review date.
 * Logic:
 * 1. Identification: Validates the user session and the specific 'cardId' from query params.
 * 2. Spaced Repetition: Delegates to the 'updateSRS' utility to apply memory algorithms 
 * (Interval, Ease Factor, Step count).
 * 3. Progress Tracking: Updates or creates a 'FlashcardProgress' entry unique to the 
 * User-Card pair.
 * 4. Return: Provides the updated progress state to allow the UI to show 
 * the next scheduled review time.
 */

import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { updateSRS } from "@/lib/srs/updateSRS";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
export async function POST(request: Request){
    await dbConnect();
    const session = await getServerSession(authOptions);
    if(!session?.user._id){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }
    const userId = session.user._id;

    const { rating } = await request.json();
     const { searchParams } = new URL(request.url)
            const cardId = searchParams.get('cardId');

            if(!cardId){
                return errorResponse(
                    "No card id present",
                    401,
                    401
                )
            }
            try {
               
                // 2. Find the progress and update the SRS
                const { progress, parentSetId } = await updateSRS(cardId,userId,rating);

                if(!progress){
                    return errorResponse(
                        "Card not updated",
                        404,
                        404
                    )
                }

                return successResponse(
                    "Successfully updated card",
                    {
                        progress,
                        parentSetId,
                    },
                    200,
                    200
                )
            } catch (error) {
                console.warn("[flashcard review route] Error updating card", error);
                return errorResponse("Error updating card", 500, 500);
            }
}