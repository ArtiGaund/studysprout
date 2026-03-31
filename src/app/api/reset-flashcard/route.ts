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
import { FlashcardModel, FlashcardProgressModel } from "@/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(request: Request){
    await dbConnect();

    const session = await getServerSession(authOptions);
    if(!session?.user) return errorResponse(
        "Unauthorized",
        401,
        401,
    )
    const { searchParams} = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if(!cardId){
        return errorResponse(
            "No card id is present",
            400,
            400,
        )
    }
    try {

        const card = await FlashcardModel.findById(cardId);

        if(!card){
            return errorResponse(
                "No card found",
                404,
                404
            )
        }
        await card.save();

        await FlashcardProgressModel.findOneAndDelete({
            cardId,
            userId: session.user._id,
        });
        
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