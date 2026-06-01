/**
 * GET /api/workspace/[workspaceId]/research-graph
 * 
 * Returns 7 day activity data for the Weekly Research Goal graph
 * 
 * Activity score per day = cards reviewed that day + file touched that day.
 * Both signals already exist in FlashcardProgress.lastReviewed and File.lastUpdated
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FlashcardProgressModel, StudyGoalModel } from "@/model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

// Build an array of the last 7 days 
function getLast7Days(): { date: string; label: string}[]{
    const days: { date: string; label: string }[] = [];
    const labels = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for(let i = 6;i >= 0; i--){
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];  //"2026-05-12"
        days.push({
            date: dateStr,
            label: labels[d.getDay()],
        })
    }
    return days;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { workspaceId: string } }
) {
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Workspace Research Graph route] Unauthorized",
            401,
            401,
        );

        const { workspaceId} = params;
        if(!workspaceId) return errorResponse(
            "[Workspace Research Graph route] WorkspaceId is required",
            400,
            400,
        );
        const userId = new mongoose.Types.ObjectId(session.user._id);
        const wsId = new mongoose.Types.ObjectId(workspaceId);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // 1. Card reviewed per day
        const cardAvg = await FlashcardProgressModel.aggregate([
            {
                $match: {
                    userId,
                    workspaceId: wsId,
                    lastReviewed: { $gte: sevenDaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$lastReviewed",
                        },
                    },
                    count: {
                        $sum: 1,
                    },
                },
            },
        ]);

        // 2. Files touched per day
        const fileAvg = await FileModel.aggregate([
            {
                $match: {
                    workspaceId: wsId,
                    lastUpdated: { $gte: sevenDaysAgo },
                    inTrash: null,
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$lastUpdated",
                        },
                    },
                    count: {
                        $sum: 1,
                    },
                },
            },
        ]);

        // 3. Convert aggregation results to maps
        const cardMap: Record<string, number> = {};
        for(const row of cardAvg){
            cardMap[row._id] = row.count;
        }

        const fileMap: Record<string, number> = {};
        for(const row of fileAvg){
            fileMap[row._id] = row.count;
        }

        // 4. Fetch or default the daily goal
        const goal = await StudyGoalModel.findOne({
            userId,
            workspaceId: wsId,
            folderId: null,
        }).lean();

        const dailyTarget = goal?.dailyTarget ?? 10;
       
        // 5. Merge into the 7-day shape
        const day7 = getLast7Days();
        let weeklyTotal = 0;
        
        const days = day7.map(({ date, label}) => {
            const cardsReviewed = cardMap[date] ?? 0;
            const filesTouched = fileMap[date] ?? 0;
            const score = cardsReviewed + filesTouched;
            weeklyTotal += score;
            return {
                date,
                label,
                score,
                cardsReviewed,
                filesTouched,
            };
        });

        return successResponse(
            "[Workspace Research Graph route] Successfully generated the research graph",
            {
                days,
                dailyTarget,
                weeklyTotal,
                weeklyTargetTotal: dailyTarget * 7,
                percentComplete: Math.round((weeklyTotal / (dailyTarget * 7)) * 100),
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Workspace Research Graph route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Workspace Research Graph route] Internal Server Error",
            500,
            500,
        )
    }
}