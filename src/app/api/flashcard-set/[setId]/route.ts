
import dbConnect from "@/lib/dbConnect";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { 
    FlashcardModel, 
    FlashcardSetModel, 
    FileModel,
    FlashcardProgressModel
 } from "@/model";
import { getServerSession } from "next-auth";
import { onFlashcardSetDeleted } from "@/lib/activity-hooks";
import { emitSetDeleted, emitSetUpdated } from "@/lib/realtime-emitter";

/**
 * RESOURCE: Flashcard Set Detail & Sync Status
 * -------------------------------------------
 * Role: Retrieves a specific flashcard set along with user-specific progress.
 * * Key Features:
 * 1. Parallel Fetching: Retrieves Set metadata and individual Cards simultaneously.
 * 2. Outdated Detection: Compares the 'sourceSnapshot' timestamps against live File/Block 
 * updates to alert the user if the flashcards are behind the notes.
 * 3. Lazy Progress: Injects Spaced-Repetition (SRS) data from FlashcardProgressModel.
 */

export async function GET(
    request: Request,
    { params }: { params: { setId: string }}
) {
    await dbConnect();
    const { setId } = params;
    //  validation of params
    if(!setId || typeof setId !== 'string'){
        return errorResponse(
            "Invalid params",
            400,
            400
        );
    }
    const session = await getServerSession(authOptions);
    if(!session?.user._id){
        return Response.json({
            statusCode: 401,
            message: "Unauthorized",
            success: false
        }, { status: 401 })
    }
    const userId = session.user._id;
    try {
        // Fetch the Sets and Cards in paralled
        const [ set, flashcards] = await Promise.all([
            FlashcardSetModel.findById(setId).lean(),
            FlashcardModel.find({ parentSetId: setId }).lean()
        ])
        if(!set){
            return errorResponse(
                "Set not found",
                404,
                404
            )
        }
        
        // Fetch progress only for this specific user
        const cardIds = flashcards.map(flashcard => flashcard._id);
        const progressRecord = await FlashcardProgressModel.find({
            userId,
            flashcardId: { $in: cardIds }
        }).lean();

        // Map Progress by flashcardId for easy lookup
        const progressMap = new Map(
            progressRecord.map(p => [p.flashcardId.toString(), p])
        );

        // fetch all files included in this set
        let files = [];
        if(set?.resourceType === "Workspace"){
            files = await FileModel.find({ workspaceId: set?.workspaceId }).lean();
        }else if(set?.resourceType === "Folder"){
            files = await FileModel.find({ folderId: set?.folderId }).lean();
        }else{
            files = await FileModel.find({ _id: set?.resourceId }).lean();
        }

        // Process Live Data for Set and Block timestamps for flashcard
        let liveTotalBlocks = 0;
        let liveTotalChars = 0;
        // const latestBlockTimestamps: Record<string, Date> = {};
        const latestBlockState: Record<
                string,
                {
                    updatedAt: Date;
                    contentHash: string | null
                }
        > = {};

        for(const file of files){
            for(const bId of file.blockOrder){
                const blocksRaw = file.blocks as any;
                const block = blocksRaw instanceof Map
                    ? blocksRaw.get(bId)
                    : blocksRaw?.[bId];

                const textContent = 
                    block?.structuredText || 
                    block?.plainText ||
                    block?.content ||
                    "";

                if(!block?.structuredText) continue;
                if(!textContent.trim()) continue;

                liveTotalBlocks++;
                liveTotalChars+= textContent.length;
                
                latestBlockState[bId] = {
                    updatedAt: block.updatedAt,
                    contentHash: block.contentHash || null,
                };
            }

            for(const bId of file.blockOrder){
                if(latestBlockState[bId]) continue;
                const blocksRaw = file.blocks as any;
                const block = blocksRaw instanceof Map
                    ? blocksRaw.get(bId)
                    : blocksRaw?.[bId];
                if(!block) continue;
                latestBlockState[bId] = {
                    updatedAt: block.updatedAt,
                    contentHash: block.contentHash || null,
                };
            }
        }

        // Calculate if the whole SET is outdated
        const blockThreshold = 3;
        const charThreshold = Math.max(50, Math.floor(set.sourceSnapshot?.totalChars || 0) * 0.10); //10%

        const setOutdated = 
        (liveTotalBlocks - (set.sourceSnapshot?.blockCount || 0)) >= blockThreshold ||
        (liveTotalChars - (set.sourceSnapshot?.totalChars || 0)) >= charThreshold;
        if(!set){
            return errorResponse(
                "No set found",
                404,
                404
            );
        }

        // Calculate if individual cards are outdated
        const cardsWithStatus = flashcards.map(card => {
            const userProgress = progressMap.get(card._id.toString());
            const isCardOutdated = card.source.blockIds.some(id => {
                const liveState = latestBlockState[id];
                if(!liveState) return false;

                const snapshotState = card.source?.blocksState?.[id];
                if(!snapshotState) return false;

                if(liveState.contentHash && snapshotState.contentHash){
                    return liveState.contentHash !== snapshotState.contentHash;
                }

                const latest = liveState.updatedAt;
                const snapshot = snapshotState.updatedAt;
                if(!latest || !snapshot) return false;
                return new Date(latest) > new Date(snapshot);
            }) ?? false;

            return {
                ...card,
                isOutdated: isCardOutdated,
                // LAZY INITIALIZATION
                progress: userProgress ? {
                    interval: userProgress.interval,
                    difficulty: userProgress.difficulty,
                    repetition: userProgress.repetition,
                    dueDate: userProgress.dueDate.toISOString(),
                    lastReviewed: userProgress.lastReviewed?.toISOString() || null,
                } : {
                    interval: 0,
                    difficulty: 2.5,
                    repetition: 0,
                    dueDate: new Date().toISOString(),
                    lastReviewed: null,
                }
            };
        });

        return successResponse(
            "Successfully fetched flashcard set",
            {
                set: { ...set, isOutdated: setOutdated },
                flashcards: cardsWithStatus
            },
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


/**
 * PERMANENT DELETE (DELETE)
 * -------------------------
 * Role: Hard deletes a flashcard set and performs a cascading cleanup.
 * Logic:
 * 1. Ownership: Verifies the 'userId' matches the set creator.
 * 2. Cascading Progress: Deletes all Spaced-Repetition records (FlashcardProgress) 
 * associated with the cards in this set to prevent orphan data.
 * 3. Card Deletion: Removes all individual Flashcard documents.
 * 4. Set Destruction: Deletes the FlashcardSet metadata.
 * 5. Global Sync: Emits 'set-deleted' to notify active workspace clients.
 */

export async function DELETE(
    request: NextRequest,
    { params }: { params: { setId: string}}
){
    await dbConnect();
    const session = await getServerSession(authOptions);

    // 1. Validate session
    if(!session || !session.user){
        return errorResponse(
            "Unauthorized",
            401,
            401
        );
    }
    const userId = session.user._id;

    const { setId } = params;
    try {
        // 2. validation of params
        if(!setId || typeof setId !== 'string'){
            return errorResponse(
                "Invalid params",
                400,
                400
            );
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
        const workspaceId = set?.workspaceId;
        // 4. Pre-delete cleanup: Identify all cards to remove progress
        const cardsInSet = await FlashcardModel.find({ parentSetId: setId })
            .select("_id")
            .lean();
        const cardIds = cardsInSet.map(card => card._id);
        if(cardIds.length > 0){
            // Remove all Spaced Repetetion/Study stats associated with these cards
            await FlashcardProgressModel.deleteMany({
                flashcardId: { $in: cardIds },
            });
        }
        // 6. delete all flashcards belonging to this set
        await FlashcardModel.deleteMany({ parentSetId: setId });
        // 7. Delete set
        await FlashcardSetModel.deleteOne({ _id: setId });
        await onFlashcardSetDeleted(
            String(workspaceId),
            String(userId),
            String(set?.title),
            Number(set?.totalCards)
        );
        try {
            const workspaceId = String(set?.workspaceId);
            await emitSetDeleted(
                workspaceId,
                setId,
            );
        } catch (error) {
            console.error("[Flashcard Set route] Socket Failed for delete flashcard set: ",error);
        }

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

/**
 * PATCH - update flashcard set title
 */

export async function PATCH(
    request: NextRequest,
    { params }: { params: { setId: string }}
){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Flashcard Set PATCH route] Unauthorized",
            401,
            401,
        );
        const { setId } = params;
        if(!setId) return errorResponse(
            "[Flashcard Set PATCH route] flashcard set Id is required",
            400,
            400,
        );        
        const { title } = await request.json();
        if(!title || typeof title !== "string" || title.trim().length === 0){
            return errorResponse(
                "[Flashcard Set PATCH route] Title is required and cannot be empty",
                400,
                400,
            );
        }
        // Only the creater can rename their set
        const updated = await FlashcardSetModel.findOneAndUpdate(
            { 
                _id: setId,
                createdBy: session.user._id,
            },
            {
                $set: { title: title.trim() }
            },
        ).lean();
        if(!updated) return errorResponse(
            "[Flashcard set PATCH route] Flashcard set not found or you do not have permission to rename it",
            404,
            404,
        );
        const workspaceId = updated.workspaceId.toString();
        await emitSetUpdated(
            workspaceId,
            setId,
           { title: title.trim() },
        );

        return successResponse(
            "[Flashcard set PATCH route] Flashcard set title updated",
            { set: updated },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Flashcard Set PATCH route] Failed: ",error);
        return errorResponse(
            error.message ?? "[Flashcard Set PATCH route] Internal Server error",
            500,
            500,
        );
    }
}