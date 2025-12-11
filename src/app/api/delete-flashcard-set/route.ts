/**
 * DELETE /api/delete-flashcard-set
 * 
 * This route is used to delete a flashcard set
 * 
 * Responsibility:
 * - Validate request payload (setId).
 * - Find the flashcard set.
 * - Delete the flashcard set.
 * 
 * Notes:
 * - This route is used to delete a flashcard set
 */

import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { FlashcardModel, FlashcardSetModel } from "@/model";

export async function DELETE(request: NextRequest){
    await dbConnect();
    const session = await getServerSession(authOptions);

    // 1. Validate session
    if(!session || !session.user){
        return errorResponse(
            "Unauthorized",
            401,
            401
        )
    }

    const userId = session.user._id;

   const setId = request.nextUrl.searchParams.get("setId");

    try {
        // 2. validation of params
        if(!setId || typeof setId !== 'string'){
            return errorResponse(
                "Invalid params",
                400,
                400
            )
        }

        // 3. finding flashcard set
        const set = await FlashcardSetModel.findOne({
            _id: setId,
            createdBy: userId,
        });

        if(!set){
            errorResponse(
                "Flashcard set not found",
                404,
                404
            )
        }

        // 4. delete all flashcards belonging to this set
        await FlashcardModel.deleteMany({ parentSetId: setId });

        // 5. Delete set
        await FlashcardSetModel.deleteOne({ _id: setId });

        return successResponse(
            "Flashcard set deleted successfully",
            {},
            200,
            200
        )
    } catch (error) {
        console.warn("[Flashcard set delete route] Error occurred while deleting flashcard set: ",error);
        return errorResponse(
            "Error occurred while deleting flashcard set",
            500,
            500
        )
    }
}