/**
 * POST /api/generate-flashcards
 * 
 * Generate flashcards from Workspace / Folder / File notes.
 * 
 * Responsibility:
 * - Validate request payload (resourceId, resourceType, cardCount, desiredTypes).
 * - Fetch all relevant files depending on the selected resouce level.
 * - Refresh and aggregate plain-text content from files.
 * - Chunk the aggregated text for LLM processing.
 * - Call `GenerateFlashcardsFromChunks` and return unified API response.
 * 
 * Notes:
 * - This route preform heavy processing: text regeneration, chunking, AI calls.
 * - store the flashcards, and use them in UI.
 * - Error responses use the unified API response helpers.
 * - 409 error code is different from any other error code, its to handle existing flashcard set.
 */

import dbConnect from "@/lib/dbConnect";
import { GenerateFlashcardsFromChunks } from "@/lib/ai/flashcards/generate-flashcards-from-chunks";
import { getAllFilesByWorkspaceId, getCurrentFile } from "@/services/fileServices";
import { getAllFiles } from "@/services/folderServices";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import {  FlashcardModel, FlashcardSetModel, FolderModel, WorkSpaceModel } from "@/model";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { chunkBlocks } from "@/helpers/chunkBlocks";



export async function POST(
    request: NextRequest,
    { params}: { params: { setId: string }}
){
    await dbConnect();
    try {
    
        const {setId } = params;
        if(!setId){
            return errorResponse(
                "Flashcard set id is missing",
                400,
                400
            )
        }

        const existingSet = await FlashcardSetModel.findById(setId);

        if(!existingSet){
            return errorResponse(
                "Flashcard set not exists",
                404,
                404
            )
        }

        
        // current user session
        const session = await getServerSession(authOptions);

        if(!session || !session.user){
            return errorResponse(
                "You must be logged in to generate flashcards",
                401,
                401
            )
        }
        
        // current user
        const userId = session.user._id;
    
        const workspaceId = existingSet.workspaceId as string;
        const folderId = existingSet.folderId as string;
        const resourceId = existingSet.resourceId as string;
        const resourceType = existingSet.resourceType;
        const cardCount = existingSet.totalCards;
        const desiredTypes = existingSet.desiredTypes;
       
        // Data aggregation (Resolve which files to process based on selected resourceType)
        let filesToProcess = [];
        if(resourceType === "Workspace"){
            const response = await getAllFilesByWorkspaceId(workspaceId);
            if(response){
                filesToProcess = response;
            }
        }else if(resourceType === "Folder"){
            const response = await getAllFiles(folderId);
            if(response){
                filesToProcess = response;
            }
        }else if(resourceType === "File"){
            const response = await getCurrentFile(resourceId);
            if(response) {
                filesToProcess = [response];
            }
        }
      
        interface GlobalBlockEntry{
            fileId: string;
            blockId: string;
            text: string;
            updatedAt: Date;
        }
        interface BlockLookupEntry {
            fileId: string;
            updatedAt: Date;
        }
        // Flatten into global ordered block stream
        const globalBlocks: GlobalBlockEntry[] = [];
        const blockLookup: Record<string, BlockLookupEntry> = {};

        for(const file of filesToProcess){
            for(const blockId of file.blockOrder){
                const block = file.blocks[blockId];

                if(!block?.structuredText){
                    continue;
                }

                globalBlocks.push({
                    fileId: file._id.toString(),
                    blockId,
                    text: block.structuredText,
                    updatedAt: block.updatedAt,
                });
                blockLookup[blockId] = {
                    fileId: file._id.toString(),
                    updatedAt: block.updatedAt
                };
            }
        }

       const uniqueBlockIds = new Set<string>();
       let totalChars = 0;

       for(const block of globalBlocks){
        if(!uniqueBlockIds.has(block.blockId)){
            uniqueBlockIds.add(block.blockId);
            totalChars+=block.text.length;
        }
       }

       const totalBlocks = uniqueBlockIds.size;

        // chunks without losing block identity
        const chunks = chunkBlocks(globalBlocks, 12000);

        if(!chunks.length){
            return errorResponse(
                "No content available to generate flashcards.",
                400,
                400
            )
        }

        // Build AI payload with metadata
        const preparedChunks = chunks.map(chunk => ({
            text: chunk.map( block =>
                `[BLOCK:${block.blockId}]\n${block.text}`).join("\n\n"),
            meta: {
                fileIds: Array.from(new Set(chunk.map(block => block.fileId))),
                blockIds: chunk.map(block => block.blockId),
                startBlockId: chunk[0].blockId,
                endBlockId: chunk[chunk.length -1].blockId,
                blocksState: Object.fromEntries(
                    chunk.map(block => [block.blockId, { updatedAt: block.updatedAt}])
                )
            }
        }));
        const chunkCount = preparedChunks.length;
        const base = Math.floor(cardCount/chunkCount);
        const remainder = cardCount%chunkCount;

        const chunkTargets = preparedChunks.map((_,i) => 
        base + (i < remainder ? 1 : 0)
        );

        let allGeneratedCards: any[] = [];

        for(let i=0;i< preparedChunks.length;i++){
            const target = chunkTargets[i];
            if(target<0) continue; //skip empty assignment

            const chunkData = {
                text: preparedChunks[i].text,
                blockIds: preparedChunks[i].meta.blockIds,
            }

            const result = await GenerateFlashcardsFromChunks(
                [chunkData],
                target,
                desiredTypes
            );
            
            if(result?.data?.flashcards){
                allGeneratedCards.push(...result.data.flashcards);
            }
        }

        allGeneratedCards = allGeneratedCards.slice(0, cardCount);     
        //   Storing flashcards in the backend
        //  Insert flashcards referencing the set
        const flashcardsToInsert = allGeneratedCards.map(card => {
            const usedIds: string[] = card.blockIdsUsed;
            const safeIds = usedIds.filter(id => blockLookup[id]);
            return {
                type: card.type,
                question: card.question,
                answer: card.answer,
                options: card.options ?? [],
                source_context: card.source_context,

                source: {
                    fileIds: Array.from(new Set(
                        safeIds.map(id => blockLookup[id].fileId)
                    )),
                    blockIds: safeIds,

                    startBlockId: safeIds[0],
                    endBlockId: safeIds[safeIds.length -1],

                    blocksState: Object.fromEntries(
                        safeIds.map(id => [
                            id,
                            { updatedAt: blockLookup[id].updatedAt },
                        ])
                    )
                },
                resourceId,
                resourceType,
                createdBy: userId,
            }
            
        })
         const flashcardInserted = await FlashcardModel.insertMany(flashcardsToInsert);
         if(!flashcardInserted){
            return errorResponse(
                "Failed to generate flashcards",
                500,
                500
            )
         }

        const flashcardIds = flashcardInserted.map(flashcard => flashcard._id);
          //   delete all flashcards belonging to this set
                await FlashcardModel.deleteMany({ parentSetId: setId });

           //  Update flashcards to reference the new set
        await FlashcardModel.updateMany(
            { _id: { $in: flashcardIds }},
            { parentSetId: setId },
        )


        if(allGeneratedCards.length === 0){
            return errorResponse(
                 "Failed to generate flashcards",
                 500,
                 500
            )
        }

        const updatedFlashcardSet = await FlashcardSetModel.findByIdAndUpdate(
            setId,
            {
                flashcards: flashcardIds,
                totalCards: flashcardIds.length,
                updatedAt: new Date(),
                sourceSnapshot: {
                    fileIds: Array.from(new Set(globalBlocks.map(block => block.fileId))),
                    blockCount: totalBlocks,
                    totalChars: totalChars,
                },
            },
            { new: true}
        )

        if(!updatedFlashcardSet){
            return errorResponse(
                "Failed to regenerate flashcards",
                500,
                500
            )
        }


        // Return the generated flashcards
        return successResponse(
            "Flashcards set regenerated successfully",
           {
             flashcards: allGeneratedCards,
             flashcardSet: updatedFlashcardSet,
           },
            200,
            200
        )
    } catch (error) {
        console.warn("[Flashcard generated route] Error in generating flashcards: ",error);
        return errorResponse(
            "Failed to generate flashcards",
            500,
            500
        )
    }
}