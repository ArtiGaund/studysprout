    /**
 * RESOURCE: File Block Management (Create)
 * ---------------------------------------
 * Endpoint: POST /api/files/[fileId]/blocks
 * Role: Inserts a new block into the document map and updates the visual order.
 * Logic:
 * 1. Data Normalization: Extracts plain text and structured text for AI/Search indexing.
 * 2. Positional Logic: Uses 'afterBlockId' to perform a 'splice' into the 'blockOrder' array.
 * 3. Persistence: Updates the specific Key in the Mongoose Map using bracket notation.
 * 4. Versioning: Bumps the file version to prevent state desync.
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
    }
    export async function POST(
        request: Request ,
        {params } : { params: RouteParams }
    ){
        await dbConnect();
        const { fileId } = params;
        const { block, afterBlockId } = await request.json();

        // Validate File ID
        if(!fileId){
            return errorResponse(
                "Bad Request: File ID is required.",
                400,
                400,
            )
        }

        // validate block
        if(!block || !block.id || !block.type){
            return errorResponse(
                "Bad Request: Block is required.",
                400,
                400,
            );
        }

        if(!isValidId(fileId)){
            return errorResponse(
                "Invalid fileId",
                401,
                401,
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

            // if block already exist
            if(file.blocks.has(block.id)){
                const data = {
                        block: file.blocks.get(block.id),
                        blockOrder: file.blockOrder,
                    }
                return successResponse(
                    "Block already exist in the file.",
                    data,
                    200,
                    200,
                );
            }

            // saving guarding the content because  blocknote not always send an array
            const safeContent = Array.isArray(block.content)
            ? block.content
            : [];

            // insert block once
            file.blocks.set(block.id,{
                id: block.id,
                type: block.type,
                props: block.props,
                content: safeContent,
                plainText: normalizeNotes(block.content),
                structuredText: normalizeStructuredBlock({
                    id: block.id,
                    type: block.type,
                    props: block.props,
                    content: safeContent
                }),
                updatedAt: new Date(),
            });

                if(afterBlockId && file.blockOrder.includes(afterBlockId)){
                    const index = file.blockOrder.indexOf(afterBlockId);
                    file.blockOrder.splice(index + 1, 0, block.id);
                }else{
                    file.blockOrder.push(block.id);
                }
            // updating file version
            file.markModified("blocks");
            file.markModified("blockOrder");
            bumpFileVersion(file);
            await FileModel.updateOne(
                { _id: fileId },
                {
                    $set: {
                        [`blocks.${block.id}`]: file.blocks.get(block.id),
                        blockOrder: file.blockOrder,
                        lastUpdated: new Date()
                    }
                }
            );

            const data = {
                        block: file.blocks.get(block.id),
                        blockOrder: file.blockOrder,
                    }
            return successResponse(
                "Block added successfully.",
                data,
                200,
                200,
            );
        } catch (error) {
            console.warn("[Blocks route] Error while adding block: ", error);
            return errorResponse(
                "Error while adding block.",
                500,
                500
            );
        }
    }