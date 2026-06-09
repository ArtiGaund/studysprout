/**
 * Learning Goal 
 * 
 * GET /api/folder/[folderId]/learning-goal
 * 
 * Calculates and returns:
 * - hoursThisWeek
 * - weeklyTargetHours
 * - progressPercent
 * - subConceptsToday
 * - subjectLabel
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { StudyGoalModel, UserProgressModel } from "@/model";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

async function getLeaningGoal(
    request: NextRequest,
    folderId: string,
    userId: string,
    workspaceId: string
){
    const folderObjectId = new mongoose.Types.ObjectId(folderId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Start-of-week (Monday) and Start-of-today
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay(); //0 = sun
    const diff = day === 0 ? 6 : day - 1; //shift to Monday
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const [ progressThisWeek, completeToday, goal ] = await Promise.all([
        // Total minutes spent in this folder this week
        UserProgressModel.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    folderId: folderObjectId,
                    completedAt: { $gte: startOfWeek },
                },
            },
            {
                $group: {
                    _id: null,
                    totalMinutes: {
                        $sum: {
                            $ifNull: [ "$minutesSpent", 0],
                        },
                    },
                },
            },
        ]),

        // File completed Today
        UserProgressModel.countDocuments({
            userId: userObjectId,
            folderId: folderObjectId,
            createdAt: { $gte: startOfToday },
        }),

        // The user's goal for this folder
        StudyGoalModel.findOne({
            userId: userObjectId,
            folderId: folderObjectId,
        }).lean(),
    ]);

    const totalMinutesThisWeek = progressThisWeek[0]?.totalMinutes ?? 0;
    const hoursThisWeek = +(totalMinutesThisWeek / 60 ).toFixed(1);
    const weeklyTargetHours = goal?.weeklyTargetHours ?? 20;
    const progressPercent = Math.min(
        Math.round((hoursThisWeek / weeklyTargetHours) * 100),
        100
    );

    return {
        hoursThisWeek,
        weeklyTargetHours,
        progressPercent,
        subConceptsToday: completeToday,
        subjectLabel: goal?.subjectLabel ?? null,
        goalExists: !!goal,
    };
}

export async function GET(
    request: NextRequest,
    { params }: { params: { folderId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Folder learning goal GET route] Unauthorized",
            401,
            401,
        );

        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get("workspaceId") ?? "";

        const data = await getLeaningGoal(
            request,
            params.folderId,
            session.user._id,
            workspaceId,
        );

        return successResponse(
            "[Folder Learning goal GET route] data",
            { data },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Folder Learning Goal GET route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Folder Learning Goal GET route] Internal Server Error",
            500,
            500,
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { folderId: string },}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Folder learning goal PATCH route] Unauthorized",
            401,
            401,
        );

        const body = await request.json();
        const {
            weeklyTargetHours,
            subjectLabel,
            workspaceId,
        } = body;

        const goal = await StudyGoalModel.findOneAndUpdate(
            {
                userId: new mongoose.Types.ObjectId(session.user._id),
                folderId: new mongoose.Types.ObjectId(params.folderId),
            },
            {
                $set: {
                    weeklyTargetHours: weeklyTargetHours ?? 20,
                    ...(subjectLabel !== undefined && { subjectLabel }),
                    workspaceId: workspaceId
                        ? new mongoose.Types.ObjectId(workspaceId)
                        : undefined,
                },
            },
            { 
                upsert: true,
                new: true,
            }
        )

        return successResponse(
            "[Folder Learning Goal PATCH route] goal",
            { goal },
            200,
            200,
        )
    } catch (error: any) {
        console.error("[Folder Learning Goal PATCH route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Folder Learning Goal PATCH route] Internal Server Error",
            500,
            500,
        );
    }
}