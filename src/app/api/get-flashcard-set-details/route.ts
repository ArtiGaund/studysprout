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
import { FileModel, FlashcardSetModel } from "@/model";

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
                "Set not found",
                404,
                404
            )
        }

        // fetch all files included in this set
        let files = [];
        if(set?.resourceType === "Workspace"){
            files = await FileModel.find({ workspaceId: set?.workspaceId }).lean();
        }else if(set?.resourceType === "Folder"){
            files = await FileModel.find({ folderId: set?.folderId }).lean();
        }else{
            files = await FileModel.find({ _id: set?.resourceId }).lean();
        }

        // compute latest totalBlocks and totalChars
        let totalBlocks = 0;
        let totalChars = 0;

        for(const file of files){
            for(const bId of file.blockOrder){
                const block = file.blocks[bId];
                if(!block?.structuredText) continue;

                totalBlocks++;
                totalChars+= block.structuredText.length;
            }
        }

        const blockCountSnapshot = set?.sourceSnapshot?.blockCount || 0;
        const charCountSnapshot = set?.sourceSnapshot?.totalChars || 0;


        const addedBlocks = totalBlocks - blockCountSnapshot;
        const addedChars = totalChars - charCountSnapshot;

        const blockThreshold = 3;
        const charThreshold = Math.max(50, Math.floor(charCountSnapshot*0.10)); //10%

        const isOutdated = addedBlocks >= blockThreshold || addedChars >= charThreshold;
        if(!set){
            return errorResponse(
                "No set found",
                404,
                404
            )
        }

        return successResponse(
            "Successfully fetched flashcard set",
            {
                ...set,
                isOutdated
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