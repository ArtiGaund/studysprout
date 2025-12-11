/**
 * GET /api/get-flashcard-sets
 * 
 * This route is used to get all flashcard sets
 * 
 * Responsibility:
 * - Validate request payload (workspaceId).
 * - Find all flashcard sets.
 * 
 * Notes:
 * - This route is used to get all flashcard sets

 */
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FlashcardModel, FlashcardSetModel } from "@/model";

export async function GET(request: Request){
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if(!workspaceId){
        return errorResponse(
            "Workspace Id is required",
            400,
            400
        )
    }

    try {
        // Getting all flashcard sets for the workspace
        const allFlashcardSets = await FlashcardSetModel.find({ workspaceId });

        if(!allFlashcardSets || allFlashcardSets.length === 0){
            return errorResponse(
                "No flashcard sets found",
                404,
                404
            )
        }

        const today = new Date();

        // Getting dueDate + totalCards from all flashcards

        const finalSets = await Promise.all(
            allFlashcardSets.map(async (set) => {
                const cards = await FlashcardModel.find({ parentSetId: set._id });

                const dueCount = cards.filter((card) => 
                !card.lastReviewed || new Date(card.dueDate) <= today
                ).length;

                return{
                    _id: set._id,
                    title: set.title,
                    resourceType: set.resourceType,
                    workspaceId: set.workspaceId,
                    totalCards: cards.length,
                    dueCount
                }
            })
        )

        return successResponse(
            "Successfully fetched all flashcard sets of current workspace",
            finalSets,
            200,
            200,
        )
    } catch (error) {
        console.warn("[Get flashcard sets route] Error fetching flashcard sets", error);
        return errorResponse(
            "Error fetching flashcard sets",
            500,
            500
        )
    }
}