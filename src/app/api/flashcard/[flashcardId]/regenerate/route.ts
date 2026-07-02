/**
 * REGENERATE SINGLE FLASHCARD
 * ---------------------------
 * Role: Updates an existing flashcard using the latest content from the Editor.
 * Logic:
 * 1. Context Gathering: Pulls the latest 'structuredText' from the specific blocks 
 * referenced in the flashcard's source metadata.
 * 2. AI Prompting: Sends the fresh text to Gemini to generate a new Q&A pair 
 * while maintaining the original card type.
 * 3. Database Update: Replaces the old question/answer and updates the 'blocksState' 
 * snapshot to the current timestamp.
 * 4. Progress Reset: Deletes all user 'FlashcardProgress' for this specific card, 
 * as the content change makes previous memory ratings (SRS) irrelevant.
 */

import { GenerateSingleFlashcard } from "@/lib/ai/flashcards/generate-single-flashcard";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { emitCardRegenerated } from "@/lib/realtime-emitter";
import { FileModel, FlashcardModel, FlashcardProgressModel, FlashcardSetModel } from "@/model";
import { NextRequest } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: { flashcardId: string }}
) {
    await dbConnect();
    try {
        const { flashcardId } =params;
        if(!flashcardId){
            return errorResponse(
                "No flashcard id present",
                401,
                401
            );
        }
        const flashcard = await FlashcardModel.findById(flashcardId);        
        if(!flashcard){
            return errorResponse(
                "No flashcard found",
                404,
                404
            );
        }
        const desiredType = flashcard?.type;
        if(!desiredType){
            return errorResponse(
                "No flashcard type present",
                401,
                401
            );
        }
        // fetch fileIds and blockIds from the flashcard
       const { fileIds, blockIds } = flashcard.source;
       const fileMap = new Map<string,any>();
       for(const fileId of fileIds){
            const file = await FileModel.findById(fileId);
            if(!file) continue;
            fileMap.set(fileId, file);
       }
        // load latest content of the above blockIds
        const blocks: {
            blockId: string;
            text: string;
            updatedAt: Date;
        }[] = [];
        for(const fileId of fileIds){           
            const file = fileMap.get(fileId);
            if(!file) continue;
            for(const bId of blockIds){
                const block = file.blocks.get(bId);
                if(block && block.structuredText){
                    blocks.push({
                        blockId: bId,
                        text: block.structuredText,
                        updatedAt: block.updatedAt,
                    });
                }
            }
        }

        const preparedText = blocks
        .map(block => `[BLOCK:${block.blockId}]\n${block.text}`).join("\n\n");

        // sending latest content of the flashcard to Gemini api
        const newFlashcard = await GenerateSingleFlashcard(preparedText, desiredType, blockIds);
       if(!newFlashcard.success){
            return errorResponse(
           "AI did not generate any flashcards. Please try again",
           500,
           500
        )
       }

       const card = newFlashcard.flashcard;
       const updateFlashcard = await FlashcardModel.findByIdAndUpdate(
            flashcardId,
            {
                question: card.question,
                answer: card.answer,
                type: card.type,
                options: card.options ?? [],
                source_context: card.source_context,
                source: {
                    fileIds,
                    blockIds,
                    startBlockId: blockIds[0],
                    endBlockId: blockIds[blockIds.length - 1],
                    blocksState: Object.fromEntries(
                        blocks.map(b => [b.blockId, { updatedAt: b.updatedAt }])
                    )
                },
            
                updatedAt: new Date(),
            },
            { new: true }
        );

       if(!updateFlashcard){
        return errorResponse(
            "Failed to update flashcard",
            500,
            500
        );
    }
                
    //Delete progress for all users for this specific card
    // Since the content changed, the old memory rating are invalid.
    await FlashcardProgressModel.deleteMany({ flashcardId });

    // Get workspaceId from the parent set
    const parentSet = await FlashcardSetModel.findById(flashcard.parentSetId)
       .select("workspaceId")
       .lean();
   
       if(parentSet?.workspaceId){
         await emitCardRegenerated(
            parentSet.workspaceId.toString(),
            flashcard.parentSetId!.toString(),
            flashcardId,
         ).catch(() => {});
       }
    
       return successResponse(
           "Flashcard updated successfully",
           {
               flashcard: {
                ...updateFlashcard.toObject(),
                isOutdated: false,
               },
           },
           200,
           200
       );
    } catch (error) {
        console.warn("[RegenerateSingleFlashcard route] Error regenerating single flashcard", error);
        return errorResponse(
            "Error regenerating single flashcard",
            500,
            500
         );
    }
}


// Delete single flashcard