/**
 * GET FLASHCARDS DETAIL
 * ---------------------
 * Role: Fetches all cards in a set with real-time "Outdated" detection.
 * Logic:
 * 1. Retrieval: Finds all flashcards belonging to the provided 'setId'.
 * 2. Map-Reduce: Extracts all unique File and Block IDs associated with these cards.
 * 3. Live State Check: Fetches the current 'updatedAt' timestamps from the FileModel 
 * for every block used as a source.
 * 4. Sync Logic: Compares the 'snapshot' timestamp stored in the flashcard with 
 * the 'live' timestamp in the file.
 * 5. Flagging: Marks cards as 'isOutdated: true' if the source text has been edited 
 * since the card was generated.
 */
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FlashcardModel } from "@/model";

export async function GET(request: Request){
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
            const flashcards = await FlashcardModel.find({ parentSetId: setId}).lean();

            if(!flashcards){
                errorResponse(
                    "No flashcards found",
                    404,
                    404
                )
            }

            const fileMap: Record<string , boolean> = {};
            const blockLookup: Record<string , string[]> = {};

            // blockId -> list of fileIds that contain it
            for(const flashcard of flashcards){
                const src = flashcard.source;
                if(!src) continue;

                for(const fileId of src.fileIds){
                    if(!fileMap[fileId]) fileMap[fileId] = true;
                }

                for(const blockId of src.blockIds){
                    if(!blockLookup[blockId]) blockLookup[blockId] = [];
                }
            }

            // load only needed files and extract live block timestamps
            const files = await FileModel.find({
                _id: { $in: Object.keys(fileMap) }
            }).lean();

            const latestBlockState: Record<string, Date> = {};
            for(const file of files){
               const blocks = file.blocks;

                //case 1. Map
                if(blocks instanceof Map){
                    blocks.forEach((block, id) => {
                        if(block?.updatedAt) latestBlockState[id] = block.updatedAt;
                    });
                    continue;
                }    

                // case 2. Plain Object
                if(typeof blocks === "object"){
                    for(const id in blocks){
                        const block = blocks[id];
                        if(block?.updatedAt) latestBlockState[id] = block.updatedAt;
                    }
                    continue;
                }
            }

            // attach isOutdated
            const finalFlashcards = flashcards.map(flashcard => {
                const src = flashcard.source;
                if(!src) {
                    return {
                        ...flashcard,
                        isOutdated: false,
                    }
                }
                const isOutdated = src.blockIds.some( id => {
                    const latest = latestBlockState[id];
                    const snapshot = src.blocksState[id]?.updatedAt;

                    if(!latest || !snapshot) return false;

                    return new Date(latest)>new Date(snapshot);
                })
                return {
                    ...flashcard,
                    isOutdated
                }
            })

            return successResponse(
                "Successfully fetched flashcards",
                finalFlashcards,
                200,
                200
            )
        } catch (error) {
            console.warn("[FlashcardSetServices] Failed to get flashcards due to following error: ",error);
            return errorResponse(
                "Failed to get flashcards",
                500,
                500
            )
        }
}