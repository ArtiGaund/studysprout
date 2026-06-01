import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FlashcardModel, FlashcardProgressModel, FlashcardSetModel, FolderModel } from "@/model";
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
    { params }: { params: { workspaceId: string } }
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "[Workspace Stats route] Unauthorized",
            401,
            401,
        );

        const { workspaceId } = params;
        if(!workspaceId) return errorResponse(
            "[Workspace Stats route] WorkspaceId is required",
            400,
            400,
        );

        const userId = session.user._id;
        const workspaceObjectId = new mongoose.Types.ObjectId(workspaceId);
        const userObjectId = new mongoose.Types.ObjectId(userId);
        const now = new Date();
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - 7);
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - 14);

        // 1. Reading Time
        const [ 
            readingTimeResult, 
            folders,
            thisWeekFiles,
            lastWeekFiles, 
        ] = await Promise.all([
            FileModel.aggregate([
                {
                    $match: { workspaceId: workspaceObjectId }
                },
                {
                    $group: {
                        _id: null,
                        totalMinutes: { $sum: { $ifNull: [ "$readingTimeMinutes", 0] } },
                        fileCount: { $sum: 1 },
                    }
                }
            ]),
            FolderModel.find(
                { workspaceId: workspaceId },
                {
                    _id: 1,
                }
            ).lean(),
            FileModel.find(
                {
                    workspaceId: workspaceObjectId,
                    lastUpdated: { $gte: startOfThisWeek }
                },
                {
                    readingTimeMinutes: 1
                }
            ).lean(),
            FileModel.find(
                {
                    workspaceId: workspaceObjectId,
                    lastUpdated: {
                        $gte: startOfLastWeek,
                        $lt: startOfThisWeek,
                    },
                },
                {
                    readingTimeMinutes: 1,
                },
            ).lean(),
        ]);

        const totalMinutes = readingTimeResult[0]?.totalMinutes ?? 0;
        const fileCount = readingTimeResult[0]?.fileCount ?? 0;
        const readingTimeHours = parseFloat((totalMinutes / 60).toFixed(1));
        const folderCount = folders.length;
        const folderIds = folders.map(f => f._id);

        // 2. Flashcard Coverage Analysis
        // workspaceId is always set on FlashcardSet regardless of resourceType.
        // This single query captures ALL sets across all levels:
        // -resourceType "Workspace" => workspace-level set
        // -resourceType "Folder" => folder-level set
        // -resourceType "File" => file-level set
        const allSets = await FlashcardSetModel.find(
            { workspaceId: workspaceObjectId },
            {
                _id: 1,
                resourceType: 1,
                resourceId: 1,
                folderId: 1,
            },
        ).lean();

        const hasAnyFlashcards = allSets.length > 0;

        // Workspace-level set
        const workspaceLevelSet = allSets.find(
            s => s.resourceType === "Workspace" && s.resourceId.toString() === workspaceId
        );

        const hasWorkspaceLevelSet = !!workspaceLevelSet;

        // Folder-level sets - which folders have their own set
        const folderSets = allSets.filter( s => s.resourceType === "Folder");
        const folderIdsWithSets = new Set(
            folderSets.map( s => s.resourceId.toString())
        );
        const foldersWithFlashcards = folderIds.filter(
            id => folderIdsWithSets.has(id.toString())
        ).length;

        // File-level sets - which files have their own set
        const fileSets = allSets.filter( s => s.resourceType === "File");
        const fileIdsWithSets = new Set(
            fileSets.map( s => s.resourceId.toString())
        );
        const filesWithFlashcards = fileIdsWithSets.size;

        // Overall Coverage level
        // Workspace set covers everything -> treat as full
        // Otherwise check folder + file coverage
        let flashcardCoverage: "none" | "workspace_set" | "partial" | "full";
        if(!hasAnyFlashcards){
            flashcardCoverage = "none";
        }else if(hasWorkspaceLevelSet){
            flashcardCoverage = "workspace_set";
        }else if(foldersWithFlashcards === folderCount && folderCount > 0){
            flashcardCoverage = "full";
        }else{
            flashcardCoverage = "partial";
        }

        if(!hasAnyFlashcards){
            return successResponse(
                "[Workspace Stats route]",
                {
                    readingTimeMinutes: totalMinutes,
                    readingTimeHours,
                    fileCount,
                    folderCount,
                    flashcardCoverage,
                    hasAnyFlashcards: false,
                    hasWorkspaceLevelSet: false,
                    foldersWithFlashcards: 0,
                    filesWithFlashcards: 0,
                    totalCards: 0,
                    masteredCount: 0,
                    recallRate: null,
                    totalReviewed: 0,
                    hasProgress: false,
                },
                200,
                200,
            );
        }

        // 3. Aggregate all flashcard IDs across all sets
        const setIds = allSets.map(s => s._id);

        const flashcardsInScope = await FlashcardModel.find(
            { parentSetId: { $in: setIds }},
            {
                _id: 1,
            }
        ).lean();

        const flashcardIds = flashcardsInScope.map( f=> f._id);
        const totalCards = flashcardIds.length;

        // 4. User Progress
        let masteredCount = 0;
        let recallRate: number | null = null;
        let totalReviewed = 0;
        let hasProgress = false;

        if(totalCards > 0){
            const progressResult = await FlashcardProgressModel.aggregate([
                {
                    $match: {
                        userId: userObjectId,
                        flashcardId: { $in: flashcardIds },
                    }
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
                                $cond: [{ $gt: [ "$repetition", 0] }, 1, 0]
                            },
                        }
                    }
                }
            ]);

            if(progressResult[0]){
                hasProgress = true;
                const { avgDifficulty, mastered, reviewed } = progressResult[0];
                masteredCount = mastered;
                totalReviewed = reviewed;
                const rawRecall = ((avgDifficulty - MIN_EASE ) / (MAX_EASE - MIN_EASE)) * 100;
                recallRate = Math.min(100, Math.max(0, parseFloat(rawRecall.toFixed(1))));
            }
        }

        const thisWeekTime = thisWeekFiles.reduce((sum, f) => sum + (f.readingTimeMinutes ?? 0),0);
        const lastWeekTime = lastWeekFiles.reduce((sum, f) => sum + (f.readingTimeMinutes ?? 0),0);

        const velocityPercent: number | null = lastWeekTime === 0
            ? null
            : Math.round(((thisWeekTime - lastWeekTime) / lastWeekTime) * 100)
        
        return successResponse(
            "[Workspace Stats route]",
            {
                readingTimeMinutes: totalMinutes,
                readingTimeHours,
                fileCount,
                folderCount,
                // Coverage
                flashcardCoverage,
                hasAnyFlashcards,
                hasWorkspaceLevelSet,
                foldersWithFlashcards,
                filesWithFlashcards,
                // Progress
                totalCards,
                masteredCount,
                recallRate,
                totalReviewed,
                hasProgress,
                velocityPercent,
            },
            200,
            200,
        )
    } catch (error: any) {
        console.error("[Workspace Stats route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Workspace Stats route] Internal Server error",
            500,
            500,
        )
    }
}