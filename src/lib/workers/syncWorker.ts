/**
 * @worker FileSyncWorker
 * @description An asynchronous background worker that synchronizes real-time collaborative 
 * editor data (Yjs) with the persistent MongoDB storage.
 * * TECHNICAL HIGHLIGHTS:
 * 1. Off-Main-Thread Processing: Offloads expensive CRDT hydration and XML crawling to BullMQ.
 * 2. Yjs Integration: Reconstructs Y.Doc from binary updates to extract structured block data.
 * 3. Smart Diffing: Compares existing blocks with incoming Yjs nodes to preserve 'updatedAt' 
 * timestamps unless content actually changes—critical for accurate StudySprout flashcard logic.
 * 4. Resource Hygiene: Configures Redis cleanup policies (`removeOnComplete`) to prevent memory exhaustion.
 */

import { ConnectionOptions, Worker } from "bullmq";
import { FileModel } from "@/model";
import * as Y from "yjs";
import { IBlock } from "@/model/file.model";
import { normalizeYjsBlock } from "@/utils/yjs-utils";
import { estimateReadingTimeFromBlocks } from "@/utils/intelligence/reading-time";
import { generateAutoSummary } from "@/utils/intelligence/auto-summary";
import dbConnect from "../dbConnect";
import { callGeminiText } from "../ai/flashcards/gemini-client";
import { extractTermsFromBlocks } from "@/utils/intelligence/term-extractor";
import { redisConnection } from "../bullmq/redis-connection";
import { markTermIndexStale } from "@/lib/workers/workspace-term-index";
import { onFileUpdated } from "../activity-hooks";

// const connection: ConnectionOptions = {
//     host: process.env.REDIS_HOST || "127.0.0.1",
//     port: parseInt(process.env.REDIS_PORT || "6379"),
//     maxRetriesPerRequest: null,
// };

let worker: Worker | null = null;

export const initFileSyncWorker = () => {
    // Singleton pattern to avoid redundant workers in dev HMR
    if(worker) return;
    worker = new Worker("file-sync-queue", async (job) => {

        const { fileId, contentBinary } = job.data;

        await dbConnect();
        try {
            // contentBinary here is the Base64 string sent from the server
            const buffer = Buffer.from(contentBinary, "base64");
    
            // --- 1. CRDT Hydration ---
            // Rebuilding the Yjs document state from the binary update log
            const doc = new Y.Doc();
            Y.applyUpdate(doc, new Uint8Array(buffer));
            const fragment = doc.getXmlFragment("document-content");
    
            const existingFile = await FileModel.findById(fileId).lean();
            
            const existingBlocks = existingFile?.blocks || {};
    
            // 2. Mapping Logic (for Flashcards)
            const blockMap = new Map<string, IBlock>();
            const blockOrder: string[] = [];
    
            /**
             * @function crawl
             * Recursive DFS traversal of the Yjs XML tree to flatten hierarchical data 
             * into a normalized block structure for the database.
             */
            const crawl = (node: any) => {
                // 1. Try to normalize if it's a container
                if(node instanceof Y.XmlElement && node.nodeName === "blockContainer"){
                    const newBlock = normalizeYjsBlock(node);
                    if(newBlock){
                        // Check if the block is effectively empty (whitespace only)
                        const isContentEmpty = newBlock.content.trim().length === 0;
                        // console.log("[SyncWorker] isContentEmpty: ",isContentEmpty);
                        const existingBlock = (existingBlocks as Record<string, IBlock>)[newBlock.id];
                        
                        // always keep id in blockOrder to maintain editor structure
                         blockOrder.push(newBlock.id);
                        // Only update updatedAt if the content actually changed
                        if(existingBlock && existingBlock.content === newBlock.content){
                            newBlock.updatedAt = existingBlock.updatedAt;
                        }else{
                            newBlock.updatedAt = new Date();
                        }
                        blockMap.set(newBlock.id, newBlock);
                       
                    }
                }
                // 2. Always check children
                if(node instanceof Y.XmlElement || node instanceof Y.XmlFragment){
                    node.toArray().forEach((child) => crawl(child));
                }
            };
    
            crawl(fragment);
    
            const blocksObject = Object.fromEntries(blockMap);
            const readingTime = estimateReadingTimeFromBlocks(blocksObject, blockOrder);
    
            const autoSummary = generateAutoSummary(blocksObject, blockOrder);
            const terms = extractTermsFromBlocks(blocksObject, blockOrder);
            // 3. Database Persistence
            // Save the raw binary for the next editor session and mapped the blocks for flashcards
            await FileModel.findByIdAndUpdate(fileId, {
                $set: {
                    contentBinary: buffer,
                    blocks: blocksObject,
                    blockOrder: blockOrder,
                    contentLastModified: new Date(),
                    lastUpdated: new Date(),
                    readingTimeMinutes: readingTime,
                    autoSummary,
                    simplificationOutdated: true,
                    terms,
                }
            });

            if(existingFile?.workspaceId){
                 await markTermIndexStale(existingFile?.workspaceId);
            }   

            if(existingFile?.workspaceId && existingFile.folderId){
                onFileUpdated(
                    String(existingFile.workspaceId),
                    String(existingFile.folderId),
                    String(fileId),
                    "system",
                    existingFile.title || "Untitled",
                );
            }
           
            // console.log(
            //         `[SyncWorker] Persisted: ${fileId} | ${blockOrder.length} blocks | 
            //         ${readingTime}min read`
            // );

            // console.log("[SyncWorker] file.terms: ",existingFile?.terms);
           
        } catch (error) {
            console.error("[SyncWorker] error: ",error);
            throw error;
        }
    }, {
        connection: redisConnection,
        // Cleanup jobs on Redis memory doesn't grow forever
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
    });

    worker.on("failed", (job, error) => {
        console.error(`[SyncWorker] BullMQ job: ${job?.id} failed for file ${job?.data.fileId}: `,error);
    })
}
