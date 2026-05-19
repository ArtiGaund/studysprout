
import dbConnect from "@/lib/dbConnect";
import { FileModel, WorkSpaceModel } from "@/model";

export interface PrerequisiteResult{
    fileId: string;
    prerequisites: string[];
}

// --- Minimum term length to avoid noisy short matches ---
const MIN_TERM_LENGTH = 4;

// --- Core detection ----

/**
 * Detects prerequisite relationships between files using the workspace term index.
 * 
 * Algorithm:
 *  1. Load workspace.termIndex: { term -> [ fileId, ...]}
 *  2. For each target file: pull its full text (joined plainText from blocks)
 *  3. For each term in the index:
 *      If the term appears in the file's text AND the defining file ≠ this file:
 *         → that defining file is a prerequisite
 *  4. Deduplicate prerequisite fileIds and return
 * 
 * @param fileIds List of fileIds to analyze
 * @param workspaceId The workspace whose termIndex to use
 */

export async function detectFilePrerequisites(
    fileIds: string[],
    workspaceId: string,
): Promise<PrerequisiteResult[]>{
    try {
        await dbConnect();
        
        // Load term index
        const workspace = await WorkSpaceModel.findById(workspaceId, {
            termIndex: 1,
        }).lean();

        const termIndex = (workspace?.termIndex ?? {})as Record<string, string[]>;
        const termEntries = Object.entries(termIndex).filter(
            ([term]) => term.length >= MIN_TERM_LENGTH
        );

        if(termEntries.length === 0){
            return fileIds.map((fileId) => ({ fileId, prerequisites: []}));
        }

        // Load full text for each target file 
        const files = await FileModel.find(
            { _id: { $in: fileIds }},
            { 
                _id: 1, 
                blocks: 1,
                blockOrder: 1
            }
        ).lean();

        const fileTextMap = new Map<string,string>();  //Map<fileId,fullText>

        for(const file of files){
            const blocksRaw = file.blocks as any;
            const order = (file.blockOrder as string[]) ?? [];

            const fullText = order
                    .map((bid) => {
                        const block = 
                                blocksRaw instanceof Map
                                    ? blocksRaw.get(bid)
                                    : blocksRaw?.[bid];
                        return ((block?.plainText || block?.content || "") as string);
                    })
                    .join(" ")
                    .toLowerCase();

            fileTextMap.set(String(file._id), fullText);
        }

        // Match terms against each file's text
        const results: PrerequisiteResult[] = [];
        const fileIdSet = new Set(fileIds.map(String));

        for(const fileId of fileIds){
            const fullText = fileTextMap.get(fileId) ?? "";
            const prerequisiteSet = new Set<string>();
            const matchCount = new Map<string, number>();  //only count as prerequisite if 3+ distinct
                                                            // terms match: definingFileId -> match count

            for(const [ term, definingFileIds ] of termEntries){
                // skip if this file itself is the only definer
                const otherDefiningFiles = definingFileIds.filter(
                    (id) => id !== fileId && fileIdSet.has(id)
                );
                if(otherDefiningFiles.length === 0) continue;

                // Whole-word match - escape regex special chars
                const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                const regex = new RegExp(`\\b${escaped}\\b`, "i");

                if(regex.test(fullText)){
                    for(const defId of otherDefiningFiles){
                        // prerequisiteSet.add(defId);
                        matchCount.set(defId, (matchCount.get(defId) ?? 0) + 1);
                    }
                }
            }

            // only add as a prerequisite if 3+ terms match
            const PREREQ_THRESHOLD = 3;
            for(const [defId, count] of Array.from(matchCount.entries())){
                if(count >= PREREQ_THRESHOLD){
                    prerequisiteSet.add(defId);
                }
            }

            results.push({
                fileId,
                prerequisites: Array.from(prerequisiteSet),
            });
        }

        return results;
    } catch (error) {
        console.error("[DetectFilePrerequisites] error: ",error);
        throw error;
    }
}