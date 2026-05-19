/**
 * PDF-specific wrapper around the universal reading time estimator.
 * Convert StructuralBlock[] to the blockmap format the universal estimator expects, then delegates.
 */

import { FileModel } from "@/model";
import { StructuralBlock } from "../pdf/pdf-structural-parser";
import { estimateReadingTimeFromBlocks } from "./reading-time";

export function estimateReadingTime(
    blocks: StructuralBlock[]
): number{
   const blockMap: Record<string, any> = {};
   const blockOrder: string[] = [];

   for(const block of blocks){
        blockMap[block.id] = {
            plainText: typeof block.content === "string"
                         ? block.content 
                         : (block.content as string[][])
                            .map((r) => r.join(" | "))
                            .join("\n"),
            type: block.type,
            props: block.props,
        };
        blockOrder.push(block.id);
   }

   return estimateReadingTimeFromBlocks(blockMap, blockOrder);
}

export interface StudySession{
    files: {
        fileId: string;
        title: string;
        readingTimeMinutes: number;
    }[];
    totalMinutes: number;
    remainingFiles: number;
    remainingSessions: number;
    message: string;
}

/**
 * Generates a study plan for a folder given available time.
 * Returns which files to ready today and estimates for remaining sessions.
 * 
 * Respects prerequisites - never suggests a file before its prerequisites.
 * Order by prerequisite chain first, then by file order.
 */

export async function generateStudyPlan(
    folderId: string,
    availableMinutes: number,
    completedFileIds: string[] = [],
): Promise<StudySession>{
    const files = await FileModel.find({ folderId })
        .select("title readingTimeMinutes prerequisites blockOrder")
        .lean();

    if(files.length === 0){
        return {
            files: [],
            totalMinutes: 0,
            remainingFiles: 0,
            remainingSessions: 0,
            message: "No Files found in this folder",
        };
    }

    // Filter out completed files
    const completedSet = new Set(completedFileIds.map(String));
    const remaining = files.filter((file) => !completedSet.has(String(file._id)));

    // Filter out files whose prerequisites aren't met
    const available = remaining.filter((file) => {
        const prereqs = (file.prerequisites || []) as string[];
        return prereqs.every((prereqId) => completedSet.has(String(prereqId)));
    });

    // Build today's session greedily
    const todayFiles: typeof files = [];
    let totalMinutes = 0;

    for(const file of available){
        const fileTime = file.readingTimeMinutes || 5;
        if(totalMinutes + fileTime <= availableMinutes){
            todayFiles.push(file);
            totalMinutes += fileTime;
        }
    }

    // Estimate remaining sessions
    const remainingFiles = remaining.length - todayFiles.length;
    const avgSessionMinutes = availableMinutes;
    const remainingTotalMinutes = remaining
        .slice(todayFiles.length)
        .reduce((sum, f) => sum + (f.readingTimeMinutes || 5), 0);
    const remainingSessions = Math.ceil(remainingTotalMinutes / avgSessionMinutes);

    const message = todayFiles.length === 0
                    ? "All available files completed or prerequisites not met"
                    : `${todayFiles.length} file${todayFiles.length > 1 ? "s" : ""} selected
                    for this session`;

    return {
        files: todayFiles.map((file) => ({
            fileId: String(file._id),
            title: file.title,
            readingTimeMinutes: file.readingTimeMinutes || 5,
        })),
        totalMinutes,
        remainingFiles,
        remainingSessions,
        message,
    };
}