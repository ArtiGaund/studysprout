/**
 * RESOURCE: Flashcard Set Generation Engine
 * ------------------------------------
 * Endpoint: POST /api/flashcard-set
 * Role: Orchestrates the AI-driven transformation of notes into study sets.
 * * Logic Flow:
 * 1. Aggregation: Resolves files based on ResourceType (Workspace/Folder/File).
 * 2. Identity-Preserved Chunking: Breaks text into blocks without losing reference IDs.
 * 3. AI Pipeline: Iterates through chunks and calls Gemini/LLM for question generation.
 * 4. Progress Reporting: Emits real-time percentages to the Socket server during the loop.
 * 5. Persistence: Stores individual Cards and links them to a new FlashcardSet.
 * * Conflict Handling: Returns 409 if a set already exists for the resource (prevents duplicates).
 */

import dbConnect from "@/lib/dbConnect";
import { GenerateFlashcardsFromChunks } from "@/lib/ai/flashcards/generate-flashcards-from-chunks";
import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { FileModel, FlashcardModel, FlashcardSetModel, FolderModel, WorkSpaceModel } from "@/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { generateFlashcardsSetTitle } from "@/lib/ai/flashcards/generate-flashcard-set-title";
import { chunkBlocks } from "@/helpers/chunkBlocks";
import { getMockFlashcards } from "@/lib/testing/mock-flashcard-generator";
import { File } from "@/model/file.model";
import { emitServerEvent } from "@/lib/server-realtime";
import { onFlashcardSetGenerated } from "@/lib/activity-hooks";


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
            desiredTypes: incomingDesiredTypes,
        } = payload;

        let desiredTypes = incomingDesiredTypes;

        // current user session
        const session = await getServerSession(authOptions);

        if(!session || !session.user || !session.user._id){
            return errorResponse(
                "You must be logged in to generate flashcards",
                401,
                401
            )
        }
        
        // current user
        const userId = session.user._id;

        //  Basic payload validation (prevent calling expensive operations on invalid input)
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

        if(!desiredTypes || !Array.isArray(desiredTypes) || desiredTypes.length === 0){
            desiredTypes = ["question-answer", "fill-in-the-blank", "mcq"];
        }

        // Check if flashcard set already exists
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


        // Data aggregation (Resolve which files to process based on selected resourceType)
        let filesToProcess: File[] = [];
        if(resourceType === "Workspace"){
            const response = await FileModel.find({ workspaceId: resourceId}).lean();
            if(response){
                filesToProcess = response as unknown as File[];
            }
        }else if(resourceType === "Folder"){
            const response = await FileModel.find({ folderId: resourceId }).lean();
            if(response){
                filesToProcess = response as unknown as File[];
            }
        }else if(resourceType === "File"){
            const response = await FileModel.findById(resourceId).lean();
            if(response) {
                filesToProcess = [response as unknown as File];
            }
        }

        if(!filesToProcess || filesToProcess.length === 0){
            return errorResponse(
                "No Files found for this resource",
                404,
                404,
            )
        }

        interface GlobalBlockEntry{
            fileId: string;
            blockId: string;
            text: string;
            updatedAt: Date;
            contentHash: string | null;
        }
        interface BlockLookupEntry {
            fileId: string;
            updatedAt: Date;
            contentHash: string | null;
        }
        // Flatten into global ordered block stream
        const globalBlocks: GlobalBlockEntry[] = [];
        const blockLookup: Record<string, BlockLookupEntry> = {};

        for(const file of filesToProcess){
            const fileId = file._id?.toString();
            if(!fileId) continue;
            for(const blockId of file.blockOrder){
                const blocksRaw = file.blocks as any;
                const block = blocksRaw instanceof Map
                    ? blocksRaw.get(blockId)
                    : blocksRaw?.[blockId];

                if(!block?.structuredText){
                    continue;
                }

                const blockText = 
                    block?.structuredText ||
                    block?.plainText ||
                    block?.content || 
                    "";
                
                if(!blockText.trim()) continue;

                globalBlocks.push({
                    fileId,
                    blockId,
                    text: blockText,
                    updatedAt: block?.updatedAt || new Date(),
                    contentHash: block?.contentHash || null,
                });

                blockLookup[blockId] = {
                    fileId,
                    updatedAt: block?.updatedAt || new Date(),
                    contentHash: block?.contentHash || null,
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
                    chunk.map(block => [
                        block.blockId, 
                        { 
                            updatedAt: block.updatedAt,
                            contentHash: block.contentHash,
                        }
                    ])
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
            const blockIds = preparedChunks[i].meta.blockIds;

            //  --- TOGGLING FOR TESTING

            const USE_MOCK = process.env.FLASHCARD_USE_MOCK === "true";
            console.log("[Flashcard set route] USE_MOCK: ",USE_MOCK);

            if(USE_MOCK){
                console.log("[Flashcard set route] running use mock")
                await new Promise(resolve => setTimeout(resolve, 800));

                const mockCards = getMockFlashcards(target, blockIds);

                allGeneratedCards.push(...mockCards);

                console.log("[Flashcard set route] mockCards length: ",mockCards.length);

                // Calculate
                const percent = Math.round(((i+1)/ preparedChunks.length) * 100);

                console.log("[Flashcard set route] percent: ",percent);

                // EMIT PROGRESS via an internal fetch to realtime server
                // This triggers the 'report_progress' logic on server.ts
                try {
                    console.log("[Flashcard set route] emitting server");
                   const socketRes = await fetch("http://localhost:4000/emit/progress-update", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            resourceId: String(resourceId),
                            workspaceId: String(workspaceId),
                            progress: percent,
                            currentCount: allGeneratedCards.length,
                            totalCards: cardCount,
                        }),
                    });

                    console.log("[Flashcard set route] socketRes: ",socketRes);

                    if(!socketRes.ok){
                        console.warn(`[Flashcard set route] Socket Server rejected update (likely
                            no lock found).`)
                    }

                } catch (error) {
                    console.error("[Flashcard Set route] Failed to notify socket server: ",error);
                }
                
            }else{  
                const result = await GenerateFlashcardsFromChunks(
                [chunkData],
                target,
                desiredTypes,
            );
            
            if(result?.data?.flashcards){
                allGeneratedCards.push(...result.data.flashcards);
            }
        }

            
        }

        allGeneratedCards = allGeneratedCards.slice(0, cardCount);
        
        //  Storing flashcards in the backend
        // Insert flashcards referencing the set
        const flashcardsToInsert = allGeneratedCards.map(card => {
            const usedIds: string[] = card.blockIdsUsed;
            const safeIds = usedIds.filter(id => blockLookup[id]);
            return {
                type: card.type,
                question: card.question,
                answer: card.answer,
                options: card.options ?? [],
                diagram: card.diagram ?? "",
                chartData: card.chartData ?? null,
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
                            { 
                                updatedAt: blockLookup[id].updatedAt,
                                contentHash: blockLookup[id].contentHash, 
                            },
                        ])
                    )
                },
                resourceId,
                resourceType,
                createdBy: userId,
            }
            
        })
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
        let actualFolderId = folderId;
        if(resourceType === "File" && !actualFolderId){
            const file = await FileModel.findById(resourceId).select("folderId").lean();
            actualFolderId = file?.folderId;
        }else if(resourceType === "Folder"){
            actualFolderId = resourceId;
        }

         // Creating a flashcardset
        const newFlashcardSet = await FlashcardSetModel.create({
            title: flashcardSetTitle ?? "Generated flashcards",
            workspaceId,
            folderId: actualFolderId ||null,
            resourceId,
            resourceType,
            createdBy: userId,
            totalCards: flashcardInserted.length,
            updatedAt: new Date(),
            flashcards: flashcardIds,
            desiredTypes,
            sourceSnapshot: {
                fileIds: Array.from(new Set(globalBlocks.map(block => block.fileId))),
                blockCount: totalBlocks,
                totalChars: totalChars
            }
        })

        try {
            await emitServerEvent('set-created', {
                workspaceId: String(workspaceId),
                resourceId: String(resourceId),
            });
        } catch (error) {
            console.error("[Flashcard set route] Socket Failed for set creation: ",error);
        }
           //  Update flashcards to reference the new set
        await FlashcardModel.updateMany(
            { _id: { $in: flashcardIds }},
            { parentSetId: newFlashcardSet._id },
        )


        if(allGeneratedCards.length === 0){
            return errorResponse(
                 "Failed to generate flashcards",
                 500,
                 500
            )
        }

        await onFlashcardSetGenerated(
            workspaceId,
            userId,
            newFlashcardSet.title,
            newFlashcardSet.totalCards,
            resourceType === "File"
                ? { fileId: resourceId, fileTitle: resourceName }
                : resourceType === "Folder"
                    ? { folderId: resourceId, folderTitle: resourceName }
                    : undefined //workspace level - no source needed
        );

        // Return the generated flashcards
        return successResponse(
            "Flashcards generated successfully",
           {
             flashcards: flashcardInserted,
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


export async function GET(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session || !session.user) return errorResponse(
            "[Flashcard Set GET route] Unauthorized.",
            401,
            401,
        );

        const userId = session.user._id;
        const { searchParams } = new URL(request.url);
        const resourceId = searchParams.get("resourceId");
        const resourceType = searchParams.get("resourceType");
        const workspaceId = searchParams.get("workspaceId");

        if(!resourceId || !resourceType || !workspaceId) return errorResponse(
            "[Flashcard Set GET route] resourceId, resourceType and workspaceId is required",
            400,
            400,
        );

        // 1. Fetch current level's Flashcard set
        const current = await FlashcardSetModel.findOne({
            resourceId,
            resourceType,
        }).lean();

        // 2. Fetch children sets (one level below)
        let children: any[] = [];

        if(resourceType === "Workspace"){
            // Children = folder-level sets within this workspace
            children = await FlashcardSetModel.find({
                workspaceId,
                resourceType: "Folder",
            }).lean();
        }else if(resourceType === "Folder"){
            // Children = file-level sets within this folder
            children = await FlashcardSetModel.find({
                folderId: resourceId,
                resourceType: "File",
            }).lean();
        }

        // File-level -> no children

        return successResponse(
            "[Flashcard Set GET route] Flashcard sets fetched successfully",
            {
                current: current ?? null,
                children,
            },
            200,
            200,
        );

    } catch (error: any) {
        console.error("[Flashcard Set GET route] Error: ",error.message);
        return errorResponse(
            error.message ?? "[Flashcard Set GET route] Failed to fetch flashcard sets",
            500,
            500
        );
    }
}