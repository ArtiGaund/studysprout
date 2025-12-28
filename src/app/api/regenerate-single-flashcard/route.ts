import { GenerateSingleFlashcard } from "@/lib/ai/flashcards/generate-single-flashcard";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FlashcardModel } from "@/model";
import { NextRequest } from "next/server";
import { start } from "repl";

export async function POST(request: NextRequest) {
    await dbConnect();
    try {
        const { flashcardId } = await request.json();

        if(!flashcardId){
            return errorResponse(
                "No flashcard id present",
                401,
                401
            )
        }

        const flashcard = await FlashcardModel.findById(flashcardId);
        

        if(!flashcard){
            return errorResponse(
                "No flashcard found",
                404,
                404
            )
        }

        const desiredType = flashcard?.type;

        if(!desiredType){
            return errorResponse(
                "No flashcard type present",
                401,
                401
            )
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
            // RESET SRS
            interval: 1,
            difficulty: 2.5,
            repetition: 0,
            dueDate: new Date(),
            lastReviewed: null,

            updatedAt: new Date(),
        },
        { new: true }
       )

       if(!updateFlashcard){
        return errorResponse(
            "Failed to update flashcard",
            500,
            500
         )
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
       )
    } catch (error) {
        console.warn("[RegenerateSingleFlashcard route] Error regenerating single flashcard", error);
        return errorResponse(
            "Error regenerating single flashcard",
            500,
            500
         )
    }
}