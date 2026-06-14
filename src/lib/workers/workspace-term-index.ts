/**
 * @module workspace-term-index
 * 
 * What it is:
 *    A flat lookup space on the workspace level in MongoDB:
 *    { "vector space": [ "fileId1", "fileId2" ], "eigenvalue": ["fileId3"] }
 * 
 * Where stored: workspace.termIndex (Record<string, string[]>)
 * Where stale flag lives: workspace.termIndexStale: boolean
 * 
 * When rebuilt:
 *      SyncWorker sets termIndexStale = true on the workspace after every file save.
 *      A periodic BullMQ job (initTermIndexWorker) checks every 30 s and rebuilds any stale
 *      workspace - collapsing rapid multi-save bursts into a single rebuild.
 * 
 * Public surface:
 *      markTermIndexStale(workspaceId) - called by SyncWorker / PDFWorker
 *      rebuildTermIndex(workspaceId) - called by the periodic worker (or on-demand)
 *      initTermIndexWorker() - starts the BullMQ repeatable job
 */
 import { redisConnection } from "@/lib/bullmq/redis-connection";
import dbConnect from "@/lib/dbConnect";
import { FileModel, WorkSpaceModel } from "@/model";
import { Queue, Worker } from "bullmq";



//  --- Queue ----
export const termIndexQueue = new Queue("term-index-rebuild", { connection: redisConnection });

// --- Mark Stale (called for SyncWorker + PDFWorker ) ---

/**
 * Called immediately after saving file.terms to MongoDB.
 * Sets a cheap boolean flag - no heavy work on the hot path.
 */
export async function markTermIndexStale(workspaceId: string):Promise<void>{
    await WorkSpaceModel.findByIdAndUpdate(workspaceId, {
        $set: {
            termIndexStale: true,
        },
    });
}

// --- Core rebuild logic ---

/**
 * Rebuilds workspace.termIndex from all files in that workspace.
 * 
 * Algorithm:
 *      For each file in the workspace:
 *          For each term in the file.terms:
 *              termIndex[term] = [...existing fileIds, fileId ]
 * 
 * Complexity: O(total terms across all files) - all in memory, one DB write
 * 
 * @param workspaceId: MongoDB ObjectId string of the workspace to rebuild
 */

export async function rebuildTermIndex(workspaceId: string): Promise<void>{
    await dbConnect();

    // Fetch only the fields we need - avoid pulling contentBinary / blocks
    try {
        const files = await FileModel.find(
            { workspaceId },
            { _id: 1, terms: 1 },
        ).lean();

        const termIndex: Record<string, string[]> = {};
        
        for(const file of files){
            const fileId = String(file._id);
            const terms = (file.terms as string[] | undefined) ?? [];

            for(const term of terms){
                if(!termIndex[term]){
                    termIndex[term] = [];
                }
                if(!termIndex[term].includes(fileId)){
                    termIndex[term].push(fileId);
                }
            }
        }

        await WorkSpaceModel.findByIdAndUpdate(workspaceId, {
            $set: {
                termIndex,
                termIndexStale: false,
                termIndexLastBuilt: new Date(),
            },
        });

    } catch (error) {
        console.error(`[TermIndex] Failed: `,error);
    }
}

// --- Periodic rebuild worker ---

let termIndexWorker: Worker | null = null;

/**
 * Starts a BullMQ worker that checks every 30 seconds for stale workspaces and rebuilds their 
 * term index.
 * 
 * Call once at a server startup alongside initFileSyncWorker() / initPDFWorker().
 */

export const initTermIndexWorker = () => {
    if(termIndexWorker) return;

    // Schedule a repeating "tick" job - one job drives all stale-workspace checks
    termIndexQueue.add(
        "rebuild-stale",
        {},
        {
            repeat: { every: 30_000 }, // every 30 seconds
            jobId: "term-index-tick",  //stable Id prevents duplicate job on restart
        }
    );
    termIndexWorker = new Worker(
        "term-index-rebuild",
        async (_job) => {
            await dbConnect();
 
            // Find all workspaces with a stale term index
            const staleWorkspaces = await WorkSpaceModel.find(
                { termIndexStale: true },
                { _id: 1 }
            ).lean();
 
            if (staleWorkspaces.length === 0) return;
 
            // Rebuild each stale workspace — sequential to avoid DB hammering
            for (const ws of staleWorkspaces) {
                try {
                    await rebuildTermIndex(String(ws._id));
                } catch (err) {
                    console.error(
                        `[TermIndex] Rebuild failed for workspace ${ws._id}:`,
                        err
                    );
                }
            }
        },
        {
            connection: redisConnection,
            removeOnComplete: { count: 10 },
            removeOnFail:     { count: 20 },
        }
    );

    termIndexWorker.on("failed", (job, err) => 
        console.error(`[TermIndex] Worker job ${job?.id} failed: `,err)
    );

}