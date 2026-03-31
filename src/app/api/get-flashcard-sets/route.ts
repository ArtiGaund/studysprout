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
import { FlashcardModel, FlashcardProgressModel, FlashcardSetModel } from "@/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(request: Request){
    await dbConnect();
    const session = await getServerSession(authOptions);
    if(!session || !session.user._id){
        return errorResponse(
            "Unauthorized",
            405,
            405
        );
    }

    const userId = session.user._id;
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
            return successResponse(
                "No flashcard set found in database",
                [],
                200,
                200,
            )
        }

        const today = new Date();

        // Getting dueDate + totalCards from all flashcards

        const finalSets = await Promise.all(
            allFlashcardSets.map(async (set) => {
                const cards = await FlashcardModel.find({ parentSetId: set._id });

                if(!cards){
                    return errorResponse(
                        "No cards found",
                        400,
                        400
                    )
                }
                const cardIds = cards.map(card => card._id);

                // Find the progress for these cards for This user
                const progressRecords = await FlashcardProgressModel.find({
                    flashcardId: { $in: cardIds },
                    userId,
                });

                // A card is Due if:
                // 1. It has no progress (New)
                // 2. Its dueDate is in the part or today
                const dueCount = cards.filter(card => {
                    const progress = progressRecords.find(p =>
                        p.flashcardId.toString() === card._id.toString()
                    );

                    if(!progress) return true //It's a new
                    return new Date(progress.dueDate) <= today;
                }).length;


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