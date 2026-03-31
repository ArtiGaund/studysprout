/**
 * RESOURCE: File Block Management (Update)
 * ---------------------------------------
 * Endpoint: PATCH /api/files/[fileId]/blocks/[blockId]
 * Role: Partially updates a block's content, type, or properties.
 * Logic:
 * 1. Targeted Update: Uses MongoDB 'dot notation' ([`blocks.${blockId}.content`]) 
 * to update only the specific block without loading the entire file document.
 * 2. Normalization: Re-triggers 'normalizeNotes' to keep the search index updated.
 * 3. Atomic Increment: Increments the version number using '$inc' to ensure sequential updates.
 */
import { isValidId } from "@/helpers/validateId";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { bumpFileVersion } from "@/lib/file/bumpFileVersion";
import { FileModel } from "@/model";
import { normalizeStructuredBlock } from "@/utils/block/normalizeStructuredBlock";
import { normalizeNotes } from "@/utils/normalizeNotes";

interface RouteParams{
    fileId: string;
    blockId: string;
}

export async function PATCH(
    request: Request ,
     {params } : { params: RouteParams }
){
    await dbConnect();
    const { fileId, blockId } = params;
  
    if(
        !fileId ||
        typeof fileId !== 'string' || 
        !blockId || 
        typeof blockId !== 'string'
        ){
        return errorResponse(
            "Bad Request: Valid 'fileId' and 'blockId' query parameters are required.",
            400,
            400,
        );
    }

    if(!isValidId(fileId)){
        return errorResponse(
            "Invalid fileId format",
            400,
            400,
        );
    }

    if(!blockId || typeof blockId !== 'string'){
        return errorResponse(
            "Invalid blockId",
            400,
            400,
        )
    }

    const payload: {
        content?: any;
        type?: string;
        props?: any;
    } = await request.json();

    if(!payload || (!payload.content && !payload.type)){
        return errorResponse(
            "Bad Request: Block content is required.",
            400,
            400,
        );
    }

    try {
        const file = await FileModel.findById(fileId);

        if(!file){
            return errorResponse(
                "File not found in the database.",
                404,
                404,
            )
        }

        if(!file.blocks.has(blockId)){
            return errorResponse(
                "Block not found in the database.",
                404,
                404,
            )
        }

        const existingBlock = file.blocks.get(blockId)!;

        const content = payload.content !== undefined ? payload.content : existingBlock.content;
        
        const updated = await FileModel.findOneAndUpdate(
            {
                _id: fileId,
                [`blocks.${blockId}`]: { $exists: true},
            },
            {
                $set: {
                    [`blocks.${blockId}.content`]: content,
                    [`blocks.${blockId}.type`]: payload.type ?? existingBlock.type,
                    [`blocks.${blockId}.props`]: payload.props ?? existingBlock.props,
                    [`blocks.${blockId}.plainText`]: normalizeNotes(content),
                    [`blocks.${blockId}.structuredText`]: normalizeStructuredBlock({
                        id: blockId,
                        type: payload.type ?? existingBlock.type,
                        props: payload.props ?? existingBlock.props,
                        content: content
                    }),
                    [`blocks.${blockId}.updatedAt`]: new Date(),
                },
                $inc: { version: 1},
            },
            { new: true}
        )

        if(!updated){
            return errorResponse(
                "Block not updated in the database.",
                404,
                404,
            );
        }
        const data = {
            block: updated.blocks.get(blockId) || null,
            blockOrder: updated.blockOrder,
        }
        return successResponse(
            "Block updated successfully.",
            data,
            200,
            200,
        );
    } catch (error) {
        console.warn("[BlockId route] Error updating block:", error);
        return errorResponse(
             "Error updating block.",
             500,
             500,
        );
    }
}


/**
 * RESOURCE: File Block Management (Update)
 * ---------------------------------------
 * Endpoint: PATCH /api/files/[fileId]/blocks/[blockId]
 * Role: Partially updates a block's content, type, or properties.
 * Logic:
 * 1. Targeted Update: Uses MongoDB 'dot notation' ([`blocks.${blockId}.content`]) 
 * to update only the specific block without loading the entire file document.
 * 2. Normalization: Re-triggers 'normalizeNotes' to keep the search index updated.
 * 3. Atomic Increment: Increments the version number using '$inc' to ensure sequential updates.
 */

export async function DELETE(
    request: Request,
    { params } : { params: RouteParams }
){
    await dbConnect();
    const { fileId, blockId } = params;

    if(!fileId || typeof fileId !== 'string' || !blockId || typeof blockId !== 'string'){
        return errorResponse(
            "Bad Request: Valid 'fileId' and 'blockId' query parameters are required.",
            400,
            400,
        );
    }
   
    try {
        const fileDeleted = await FileModel.findOneAndUpdate(
            { _id: fileId },
            {
                $unset: { [`blocks.${blockId}`]: "" },
                $pull: { blockOrder: blockId },
                $inc: { version: 1 }
            },
            { new: true }
        )

        if(!fileDeleted){
            return errorResponse(
                "File not found in the database.",
                404,
                404,
            );
        }

        return successResponse(
            "Block deleted successfully.",
            200,
            200,
        );
    } catch (error) {
        console.warn("[BlockId route] Error deleting block:", error);
        return errorResponse(
            "Error deleting block.",
            500,
            500,
        )
    }
}