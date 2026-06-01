/**
 * PATCH /api/workspace/[workspaceId]/goal
 * 
 * Update the workspace-level daily activity target.
 * Called by the "Manage Goal" modal on the workspace page.
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { StudyGoalModel } from "@/model";
import { createEvent } from "@/utils/create-event";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { workspaceId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Workspace goal route] Unauthorized",
            401,
            401,
        );

        const { dailyTarget } = await request.json();

        if(typeof dailyTarget !== "number" || dailyTarget < 1){
            return errorResponse(
                "[Workspace goal route] DailyTarget must be a positive number",
                400,
                400,
            );
        }

        const goal = await StudyGoalModel.findOneAndUpdate(
            {
                userId: new mongoose.Types.ObjectId(session.user._id),
                workspaceId: new mongoose.Types.ObjectId(params.workspaceId),
                folderId: null,
            },
            { $set: { dailyTarget } },
            { 
                upsert: true,
                new: true,
            },
        );

        // Fire activity event
        createEvent({
            workspaceId: new mongoose.Types.ObjectId(params.workspaceId) as any,
            userId: new mongoose.Types.ObjectId(session.user._id) as any,
            type: "GOAL_UPDATED",
            description: `Updated daily goal to ${dailyTarget} activities`,
            metadata: {
                hours: dailyTarget,
            },
        });

        return successResponse(
            "[Workspace goal route] Goal created ",
            {
                goal,
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Workspace goal route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Workspace goal route] Internal Server Error",
            500,
            500,
        );
    }
}