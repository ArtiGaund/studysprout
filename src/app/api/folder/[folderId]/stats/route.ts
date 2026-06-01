import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FlashcardModel, FlashcardProgressModel, FlashcardSetModel } from "@/model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const MIN_EASE = 1.3;
const MAX_EASE = 3.5;
const MASTERED_REPETITION = 3;
const MASTERED_INTERVAL = 7;

export async function GET(
    _req: NextRequest,
    { params }: { params: { folderId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "[Folder Stats route]Unauthorized",
            401,
            401,
        );

        const { folderId } = params;
        if(!folderId) return errorResponse(
            "[Folder Stats route] FolderId is required",
            400,
            400,
        );

        const userId = session.user._id;
        const folderObjectId = new mongoose.Types.ObjectId(folderId);
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // 1. Reading time
        const files = await FileModel.find(
            { folderId: folderObjectId },
            {
                _id: 1,
                readingTimeMinutes: 1,
            },
        ).lean();

        const fileCount = files.length;
        const fileIds = files.map( f => f._id);
        const totalMinutes = files.reduce(
            (sum, f) => sum + (f.readingTimeMinutes ?? 0), 0
        );

        const readingTimeHours = parseFloat((totalMinutes / 60).toFixed(1));

        // 2. Flashcard Coverage Analysis
        // Fetch ALL sets scoped to this folder - regradless of resourceType.
        // folderId is always set on FlashcardSet when created for a file or folder within this
        // folder. 
        const allSets = await FlashcardSetModel.find(
            { folderId: folderObjectId },
            { 
                _id: 1,
                resourceType: 1,
                resourceId: 1,
                totalCards: 1,
            }
        ).lean();

        const hasAnyFlashcards = allSets.length > 0;

        // Folder-level set: one set covering the whole folder
        const folderLevelSet = allSets.find(
            s => s.resourceType === "Folder" && s.resourceId.toString() === folderId
        );

        const hasFolderLevelSet = !!folderLevelSet;

        // File-level set: which files have their own set
        const fileSets = allSets.filter(
            s => s.resourceType === "File"
        );

        const fileIdsWithSets = new Set(
            fileSets.map( s => s.resourceId?.toString())
        );
        
        const filesWithFlashcards = fileIds.filter(
            id => fileIdsWithSets.has(id.toString())
        ).length;

        // Coverage level
        let flashcardCoverage: "none" | "folder_set" | "partial" | "full";
        if(!hasAnyFlashcards){
            flashcardCoverage = "none";
        }else if(hasFolderLevelSet){
            flashcardCoverage = "folder_set";
        }else if(filesWithFlashcards === fileCount && fileCount > 0){
            flashcardCoverage = "full";
        }else{
            flashcardCoverage = "partial";
        }

        // No set at all - return early with coverage info
        if(!hasAnyFlashcards){
            return successResponse(
                "[Folder Stats route]",
                {
                    readingTimeMinutes: totalMinutes,
                    readingTimeHours,
                    fileCount,
                    flashcardCoverage,
                    hasAnyFlashcards: false,
                    filesWithFlashcards: 0,
                    totalCards: 0,
                    masteredCount: 0,
                    masteryPercent: null,
                    recallRate: null,
                    totalReviewed: 0,
                    hasProgress: false,
                },
                200,
                200,
            );
        }

        // 3. Aggregate all flashcard IDs across all sets
        const setIds = allSets.map( s => s._id );

        const flashcardsInScope = await FlashcardModel.find(
            { parentSetId: { $in: setIds }},
            { 
                _id: 1,
            },
        ).lean();

        const flashcardIds = flashcardsInScope.map(f => f._id);
        const totalCards = flashcardIds.length;

        // 4. User Progress
        let masteredCount = 0;
        let masteryPercent: number | null = null;
        let recallRate: number | null = null;
        let totalReviewed = 0;
        let hasProgress = false;

        if(totalCards > 0){
            const progressResult = await FlashcardProgressModel.aggregate([
                {
                    $match: {
                        userId: userObjectId,
                        flashcardId: { $in: flashcardIds },
                    },
                },
                {
                    $group: {
                        _id: null,
                        avgDifficulty: { $avg: "$difficulty" },
                        mastered: {
                            $sum: {
                                $cond: [{
                                    $and: [
                                        { $gte: [ "$repetition", MASTERED_REPETITION ] },
                                        { $gte: [ "$interval", MASTERED_INTERVAL ] },
                                    ]
                                }, 1, 0 ]
                            }
                        },
                        reviewed: {
                            $sum: {
                                $cond: [{ $gt: [ "$repetition", 0 ] }, 1, 0 ]
                            }
                        },
                    }
                }
            ]);
            if(progressResult[0]){
                hasProgress = true;
                const { avgDifficulty, mastered, reviewed } = progressResult[0];
                masteredCount = mastered;
                masteryPercent = Math.round((mastered / totalCards) * 100);
                totalReviewed = reviewed;
                const rawRecall = ((avgDifficulty - MIN_EASE) / ( MAX_EASE - MIN_EASE)) * 100;
                recallRate = Math.min(100, Math.max(0, parseFloat(rawRecall.toFixed(1))));
            }
            // else: sets exist but user never reviewed -> hasProgress = false;
        }

        return successResponse(
            "[Folder Stats route]",
            {
                readingTimeMinutes: totalMinutes,
                readingTimeHours,
                fileCount,
                // Coverage
                flashcardCoverage,
                hasAnyFlashcards,
                hasFolderLevelSet,
                filesWithFlashcards,
                // Progress
                totalCards,
                masteredCount,
                recallRate,
                totalReviewed,
                hasProgress,
                masteryPercent
            },
            200,
            200,
        );

    } catch (error: any) {
        console.error("[Folder Stats route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Folder Stats route] Internal Server Error",
            500,
            500,
        );
    }
}