/**
 * @script backfill-plainText
 * @description One-time migration to populate the `plainText` field on every existing File
 * document that's missing it. Run this once after deploying the deriveFilePlainText fix both
 * workers - it only needs to run once; going forward both workers keep plainText in sync on every
 * save
 * 
 * Usage: npx tsx scripts/backfill-plainText.ts
 */
import dbConnect from "@/lib/dbConnect";
import { FileModel } from "@/model";
import { IBlock } from "@/model/file.model";
import { deriveFilePlainText } from "@/utils/intelligence/plain-text";

async function run() {
    await dbConnect();

    // Only target files that don't have plainText yet, so this is safe to re-run without
    // re-processing files already fixed by a normal save.
    const filter = {
        $or: [
            { plainText: { $exists: false }},
            { plainText: "" },
        ],
    };

    const total = await FileModel.countDocuments(filter);
    let processed = 0;
    let failed = 0;

    // Process in batches to avoid loading the entire collection into memory
    const BATCH_SIZE = 200;
    let lastId: string | null = null;

    while(true){
        const batchFilter: Record<string, any> = { ...filter };
        if(lastId) batchFilter._id = { $gt: lastId };

        const files = await FileModel.find(batchFilter)
            .sort({ _id: 1 })
            .limit(BATCH_SIZE)
            .lean();

        if(files.length === 0) break;

        for(const file of files){
            try {
                // blocks may be stored as a Map or plain object depending on schema config -
                // normalize to a plain object either way.
                const blocksObject:Record<string, IBlock> = 
                    file.blocks instanceof Map
                        ? Object.fromEntries(file.blocks)
                        : (file.blocks as Record<string, IBlock>) ?? {};

                const blockOrder: string[] = file.blockOrder ?? [];

                const plainText = deriveFilePlainText(blocksObject, blockOrder);

                await FileModel.findByIdAndUpdate(file._id, {
                    $set: { plainText },
                });

                processed++;
            } catch (error) {
                failed++;
                console.error(`[Backfill] Failed for file ${file._id}: `,error);
            }
        }
        lastId = String(files[files.length -1]._id);
    }
    process.exit(failed > 0 ? 1: 0);
}

run().catch((error) => {
    console.error("[Backfill] Fatal error: ",error);
    process.exit(1);
});