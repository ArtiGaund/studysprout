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

import { splitTextIntoChunks } from "@/helpers/splitTextIntoChunks";
import dbConnect from "@/lib/dbConnect";
import { GenerateFlashcardsFromChunks } from "@/lib/ai/flashcards/generate-flashcards-from-chunks";
import { getAllFilesByWorkspaceId, getCurrentFile } from "@/services/fileServices";
import { getAllFiles } from "@/services/folderServices";
import { refreshPlainTextContent } from "@/utils/fileProcessingUtils";
import { normalizeNotes } from "@/utils/normalizeNotes";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { FileModel, FlashcardModel, FlashcardSetModel, FolderModel, WorkSpaceModel } from "@/model";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { generateFlashcardsSetTitle } from "@/lib/ai/flashcards/generate-flashcard-set-title";


export async function POST(request: NextRequest){
    await dbConnect();
    try {
        const payload = await request.json();
        const {
            workspaceId,
            folderId,
            resourceId,
            resourceType,
            cardCount,
            desiredTypes
        } = payload;

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

        // 1. Basic payload validation (prevent calling expensive operations on invalid input)
        if(!resourceId || typeof resourceId !== "string" || resourceId.length === 0){
            return errorResponse(
                "Invalid resource id or resource id is missing",
                400,
                400
            )
        }

        if(!resourceType || typeof resourceType !== "string" || resourceType.length === 0){
            return errorResponse(
                "Invalid resource type or resource type is missing",
                400,
                400
            )
        }

        if(!cardCount || typeof cardCount !== "number" || cardCount<=0){
            return errorResponse(
                "Invalid card count or card count is missing",
                400,
                400
            )
        }

        if(!workspaceId || typeof workspaceId !== "string"){
            return errorResponse(
                "WorkspaceId is required",
                400,
                400
            )
        }

        //2. Check if flashcard set already exists
        const existingSet = await FlashcardSetModel.findOne({
            resourceId,
            resourceType,
            createdBy: userId
        })

        // If flashcard set exists, return error
        if(existingSet){
            return errorResponse(
                "Flashcards already exist for this resource. Delete or regenerate instead.",
                409,
                409,
                 existingSet.id,
            );
        };


        // 3.Data aggregation (Resolve which files to process based on selected resourceType)
        let filesToProcess = [];
        if(resourceType === "Workspace"){
            const response = await getAllFilesByWorkspaceId(resourceId);
            if(response){
                filesToProcess = response;
            }
        }else if(resourceType === "Folder"){
            const response = await getAllFiles(resourceId);
            if(response){
                filesToProcess = response;
            }
        }else if(resourceType === "File"){
            const response = await getCurrentFile(resourceId);
            if(response) {
                filesToProcess = [response];
            }
        }
      

        // 4. Regenerating plainText for each files
        const aggregatedTexts: string[] = [];
        for(const file of filesToProcess){
            try {
                 // Ensure plain text is up-to-date (throttled regeneration)
                await refreshPlainTextContent(file);
                 // using structuredPlainText (better for model context)
                // fallback to plainTextContent, then normalizeNotes if needed
                const sourceText = file.structuredPlainText 
                ?? file.structuredPlainText
                ?? normalizeNotes(file.data);
                 if(sourceText && String(sourceText).trim().length > 0){
                    aggregatedTexts.push(sourceText);
                }else{
                    console.warn(`[Flashcard generated route] File ${file._id}: No text to process`);
                }
            } catch (error) {
                 console.warn(`[Flashcard generated route] Error processing file ${file._id} to regenerate: `,error);
            }
        }

         //5.  Aggregate all texts
        const aggregatedSourceText = aggregatedTexts.join("\n\n");

        if(!aggregatedSourceText || aggregatedSourceText.trim().length === 0){
            return errorResponse(
                "No text to process",
                400,
                400
            )

        }
        const maxCharsPerChunk = 12000;
        //6.  Merge all extracted texts and split into model-safe chunks
        const chunks = splitTextIntoChunks(aggregatedSourceText, maxCharsPerChunk);

        //7.  Generate flashcards using Gemini (schema-enforced JSON output)
        const flashcardsResult = await GenerateFlashcardsFromChunks(chunks, cardCount, desiredTypes);

        // if flashcards are not generated due to AI overload, return error without creating new flashcard set
        if(
            !flashcardsResult.success ||
            !flashcardsResult.data ||
            flashcardsResult.data.flashcards.length === 0
        ){
            return errorResponse(
                "AI did not generate any flashcards. Please try again",
                500,
                500
            )
        }

        // 8. Storing flashcards in the backend
        // 8a. Insert flashcards referencing the set
        const flashcardsToInsert = flashcardsResult.data?.flashcards.map(card => ({
            type: card.type,
            question: card.question,
            answer: card.answer,
            options: card.options ?? [],
            source_context: card.source_context,
            resourceId,
            resourceType,
            createdBy: userId,
        }))

        const flashcardInserted = await FlashcardModel.insertMany(flashcardsToInsert);

        const flashcardIds = flashcardInserted.map(flashcard => flashcard._id);

        let resourceName = "Unknown";
        if(resourceType === "Workspace"){
            const workspace = await WorkSpaceModel.findById(resourceId).select("title");
            resourceName = workspace?.title ?? "Workspace";
        }else if(resourceType === "Folder"){
            const folder = await FolderModel.findById(resourceId).select("title");
            resourceName = folder?.title ?? "Folder";
        }else if(resourceType === "File"){
            const file = await FileModel.findById(resourceId).select("title");
            resourceName = file?.title ?? "File";
        }
        const flashcardSetTitle = generateFlashcardsSetTitle(resourceType, resourceName);
        // 8b. Creating a flashcardset
        const newFlashcardSet = await FlashcardSetModel.create({
            title: flashcardSetTitle ?? "Generated flashcards",
            workspaceId,
            folderId: folderId ||null,
            resourceId,
            resourceType,
            createdBy: userId,
            totalCards: flashcardsResult.data?.flashcards.length,
            updatedAt: new Date(),
            flashcards: flashcardIds
        })

        // 8c. Update flashcards to reference the new set
        await FlashcardModel.updateMany(
            { _id: { $in: flashcardIds }},
            { parentSetId: newFlashcardSet._id },
        )


        if(!flashcardsResult.success){
            return errorResponse(
                flashcardsResult.message || "Failed to generate flashcards",
                flashcardsResult.statusCode,
                flashcardsResult.statusCode
            )
        }

        // 8. Return the generated flashcards
        return successResponse(
            "Flashcards generated successfully",
           {
             flashcards: flashcardsResult.data!,
             flashcardSet: newFlashcardSet
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