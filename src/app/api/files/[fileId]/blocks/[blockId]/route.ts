/**
 * PATCH /api/files/{fileId}/blocks/{blockId}
 *
 * This function is used to update a block
 *
 * Responsibility:
 * - Validate request payload (fileId, blockId, updates).
 * - Find the file.
 * - Find the block.
 * - Apply updates directly to the Mongoose Document instance.
 * - Save the file.
 *
 * Notes:
 * - This function is used to update a block
 */

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
    // console.log(`[update block route ] fileId: ${fileId}, blockId: ${blockId}`);

    if(!fileId || typeof fileId !== 'string' || !blockId || typeof blockId !== 'string'){
        return Response.json({
            statusCode: 400,
            message: "Bad Request: Valid 'fileId' and 'blockId' query parameters are required.",
            success: false
        });
    }

    const payload: {
        content?: any;
        type?: string;
        props?: any;
    } = await request.json();

    if(!payload || (!payload.content && !payload.type)){
        return Response.json({
            statusCode: 400,
            message: "Bad Request: Block content is required.",
            success: false
        })
    }

    try {
        const file = await FileModel.findById(fileId);

        if(!file){
            return Response.json({
                statusCode: 404,
                message: "File not found in the database.",
                success: false
            });
        }

        if(!file.blocks.has(blockId)){
            return Response.json({
                statusCode: 404,
                message: "Block not found in the database.",
                success: false
            });
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
            return Response.json({
                statusCode: 404,
                message: "Block not updated in the database.",
                success: false
            });
        }
        return Response.json({
            statusCode: 200,
            message: "Block updated successfully.",
            success: true,
            data: {
                block: file.blocks.get(blockId),
                blockOrder: file.blockOrder,
            }
        })
    } catch (error) {
        console.warn("[BlockId route] Error updating block:", error);
        return Response.json({
            statusCode: 500,
            message: "Error updating block.",
            success: false
        });
    }
}


/**
 * DELETE /api/files/{fileId}/blocks/{blockId}
 *
 * This function is used to delete a block
 * 
 * Responsibility:
 * - Validate request payload (fileId, blockId).
 * - Find the file.
 * - Find the block.
 * - Delete the block.
 * - Save the file.
 * 
 * Notes:
 * - This function is used to delete a block
 */

export async function DELETE(
    request: Request,
    { params } : { params: RouteParams }
){
    await dbConnect();
    const { fileId, blockId } = params;

    if(!fileId || typeof fileId !== 'string' || !blockId || typeof blockId !== 'string'){
        return Response.json({
            statusCode: 400,
            message: "Bad Request: Valid 'fileId' and 'blockId' query parameters are required.",
            success: false
        });
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
            return Response.json({
                statusCode: 404,
                message: "File not found in the database.",
                success: false
            });
        }

        return Response.json({
            statusCode: 200,
            message: "Block deleted successfully.",
            success: true
        })
    } catch (error) {
        console.warn("[BlockId route] Error deleting block:", error);
        return Response.json({
            statusCode: 500,
            message: "Error deleting block.",
            success: false
        });
    }
}