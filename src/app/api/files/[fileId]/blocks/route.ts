    /**
     * GET /api/files/[fileId]/blocks/route.ts
     * 
     * This route is used to new create block inside the file
     * 
     * Responsibility:
     * - Validate fileId
     * - insert a new block in the blocks map
     * - update blockorder accordingly
     * - save file
     * 
     * Notes:
     * - This route is used to new create block inside the file
     */

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
            return Response.json({
                statusCode: 400,
                message: "Bad Request: File ID is required.",
                success: false
            }, { status: 400});
        }

        // validate block
        if(!block || !block.id || !block.type){
            return Response.json({
                statusCode: 400,
                message: "Bad Request: Block is required.",
                success: false
            }, { status: 400});
        }

        // validate afterBlockId

        try {
            const file = await FileModel.findById(fileId);

            // console.log(`[add block route] file before block added: ${JSON.stringify(file)}`);
            if(!file){
                return Response.json({
                    statusCode: 404,
                    message: "File not found in the database.",
                    success: false
                }, { status: 404 });
            }

            // if block already exist
            if(file.blocks.has(block.id)){
                return Response.json({
                    statusCode: 200,
                    message: "Block already exist in the file.",
                    success: true,
                    data: {
                        block: file.blocks.get(block.id),
                        blockOrder: file.blockOrder,
                    }
                });
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

            return Response.json({
                statusCode: 200,    
                message: "Block added successfully.",
                success: true,
                data: {
                    block: file.blocks.get(block.id),
                    blockOrder: file.blockOrder,
                }
            })
        } catch (error) {
            console.warn("[Blocks route] Error while adding block: ", error);
            return Response.json({
                statusCode: 500,
                message: "Error while adding block.",
                success: false
            }, { status: 500 });
        }
    }