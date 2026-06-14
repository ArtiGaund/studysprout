/**
 * @script migrate-concept-graph.ts
 * 
 * ONE-TIME MIGRATION SCRIPT for concept graph data.
 * 
 * Run this whenever:
 * - Update STOP_WORDS in extract-terms.ts
 * - Change MIN_TERM_LENGTH or tokenization logic
 * - Change buildFolderConceptGraph output shape
 * - Change prerequisite detection logic
 * 
 * What it does:
 * 1. Re-extracts file.terms from every file using the latest extractTermsFromBlocks
 * 2. Rebuilds workspace.termIndex for every workspace
 * 3. Rebuilds folder.conceptGraph for every folder that already have one
 * 4. Prints a summary of what changed
 * 
 * How to Run:
 *      npx tsx scripts/migrate-concept-graph.ts
 * 
 * Safe to re-run: fully idempotent - running twice gives the same  result.
 * 
 * Options (pass as env vars):
 *      WORKSPACE_ID=xxx   -> only migrate one workspace
 *      FOLDER_ID=xxx       -> only rebuild one folder's concept graph
 *      DRY_RUN=true        -> print what would change, write nothing to DB
 */
import "./setup-env";
import mongoose from "mongoose";
// import * as dotenv from "dotenv";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FolderModel, WorkSpaceModel } from "@/model";
import { extractTermsFromBlocks } from "@/utils/intelligence/term-extractor";
import { buildFolderConceptGraph } from "@/utils/intelligence/concept-graph-builder";
// dotenv.config({ path: ".env.local"});


// --- Config ---
const DRY_RUN = process.env.DRY_RUN === "true";
const WS_FILTER = process.env.WORKSPACE_ID ?? null;
const FOL_FILTER = process.env.FOLDER_ID ?? null;

async function reExtractAllFileTerms(): Promise<Map<string, string[]>>{
    // await dbConnect();

    const query = WS_FILTER ? { workspaceId: WS_FILTER } : {};
    const files = await FileModel.find(query, {
        _id: 1,
        blocks: 1,
        blockOrder: 1,
        terms: 1,
        workspaceId: 1,
    }).lean();

    let changed = 0;
    let unchanged = 0;

    // workspaceId -> set of fileIds that changed (used to mark workspace stale)
    const changedByWorkspace = new Map<string, string[]>();

    for(const file of files){
        const blocksRaw = file.blocks as any;
        const blocksObject: Record<string, any> = 
            blocksRaw instanceof Map
                ? Object.fromEntries(blocksRaw)
                : blocksRaw ?? {};
        
        const blockOrder = (file.blockOrder as string[]) ?? [];
        const newTerms = extractTermsFromBlocks(blocksObject, blockOrder);
        const oldTerms = (file.terms as string[]) ?? [];

        // Detect if terms actually changed
        const same = 
            newTerms.length === oldTerms.length &&
            newTerms.every((t, i) => t === oldTerms[i]);

        if(same){
            unchanged++;
            continue;
        }

        changed++;
        const wsId = String(file.workspaceId ?? "unknown");
        if(!changedByWorkspace.has(wsId)) changedByWorkspace.set(wsId, []);
        changedByWorkspace.get(wsId)!.push(String(file._id));
        
        if(!DRY_RUN){
            await FileModel.findByIdAndUpdate(file._id, {
                $set: {
                    terms: newTerms,
                }
            });
        }
    }

    return changedByWorkspace;
}

// --- Rebuild workspace.termIndex---
async function rebuildAllTermIndexes(changedByWorkspace: Map<string,string[]>){
    // await dbConnect();

    const workspaceIds = WS_FILTER 
        ? [WS_FILTER]
        : Array.from(changedByWorkspace.keys());
    
    if(workspaceIds.length === 0){
        return;
    }

    for(const wsId of workspaceIds){
        if(wsId === "unknown") continue;

        // Fetch all files in this workspace
        const files = await FileModel.find(
            { workspaceId: wsId },
            { _id: 1, terms: 1 },
        ).lean();

        const termIndex: Record<string, string[]> = {};

        for(const file of files){
            const fileId = String(file._id);
            const terms = (file.terms as string[]) ?? [];
            for(const term of terms){
                if(!termIndex[term]) termIndex[term] = [];
                if(!termIndex[term].includes(fileId)){
                    termIndex[term].push(fileId);
                }
            }
        }

        const termCount = Object.keys(termIndex).length;
   
        if (!DRY_RUN) {
            await WorkSpaceModel.findByIdAndUpdate(wsId, {
                $set: {
                    termIndex,
                    termIndexStale:    false,
                    termIndexLastBuilt: new Date(),
                },
            });
        }
    }
}

// --- Rebuild existing concept graph
async function rebuildExistingConceptGraphs() {
   
    // Only rebuild folders that already HAVE a concept graph
    const query: any = { conceptGraph: { $ne: null } };
    if (FOL_FILTER) query._id = FOL_FILTER;
    if (WS_FILTER)  query.workspaceId = WS_FILTER;
 
    const folders = await FolderModel.find(query, {
        _id: 1, title: 1, files: 1, workspaceId: 1,
    }).lean();
 
    if (folders.length === 0) {
        return;
    }
 
    for (const folder of folders) {
        const fileIds    = (folder.files ?? []).map(String);
        const workspaceId = String(folder.workspaceId ?? "");
 
        if (fileIds.length < 2) {
            continue;
        }
 
        if (!workspaceId) {
            continue;
        }
 
        const graph = await buildFolderConceptGraph(
            fileIds, 
            workspaceId,
            2,
            folder._id,
        );
 
        if (!DRY_RUN) {
            await FolderModel.findByIdAndUpdate(folder._id, {
                $set: {
                    conceptGraph:      graph,
                    conceptGraphStale: false,
                },
            });
        }
    }

}

async function main() {
    await dbConnect();
 
    const changedByWorkspace = await reExtractAllFileTerms();
    await rebuildAllTermIndexes(changedByWorkspace);
    await rebuildExistingConceptGraphs();
 
    await mongoose.disconnect();
    process.exit(0);
}
 
main().catch((err) => {
    console.error("❌ Migration failed:", err);
    mongoose.disconnect();
    process.exit(1);
});