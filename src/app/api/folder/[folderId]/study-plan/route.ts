/**
 * RESOURCE: Study/Session Plan Generator
 * --------------------------------------
 * Endpoint: /api/folder/[folderId]/study-plan
 * 
 * ROLE: Given available minutes, returns which files to read in this session.
 * Respects prerequisites - never suggests a file before its prerequisites.
 * 
 * Works for Both PDF folders and normal editor folders.
 * Zero AI cost - reads readingTimeMinutes from MongoDB.
 * 
 * REQUEST BODY:
 * {
 *      availableMinutes: number,           //how much time the user has
 *      completedFileIds: string[],         //files already read(for progress tracking)
 * }
 */
import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { generateStudyPlan } from "@/utils/intelligence/study-planner";
import { FolderModel, UserProgressModel } from "@/model";
import mongoose from "mongoose";

export async function POST(
    request: NextRequest,
    { params }: { params: { folderId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "Unauthorized",
            401,
            401,
        );

        const folderId = params.folderId;
        if(!folderId){
            return errorResponse(
                "No folder id found",
                400,
                400,
            );
        }

        const folder = await FolderModel.findById(folderId).lean();
        if(!folder) return errorResponse(
            "No folder found in database",
            400,
            400,
        );
        const {
            availableMinutes,
            completedFileIds
        } = await request.json();

        if(availableMinutes && (isNaN(availableMinutes) || availableMinutes < 1)){
            return errorResponse(
                "AvailableMinutes must be a positive number",
                400,
                400,
            );
        }
        const plan = await generateStudyPlan(
            folderId,
            availableMinutes || 30,
            completedFileIds || [],
        );

        return successResponse(
            "StudyPlan generated",
            plan,
            200,
            200,
        );
    } catch (error) {
        console.error("[Study Plan route] Error in generating study plan: ",error);
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { folderId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Folder Studyplan GET route] Unauthorized",
            401,
            401,
        );

        const { searchParams } = new URL(request.url);
        const availableMinutes = parseInt(searchParams.get("minutes") ?? "60");

        if(isNaN(availableMinutes) || availableMinutes <= 0){
            return errorResponse(
                "[Folder Studyplan GET route] minutes must be a positive number",
                400,
                400,
            );
        }

        // Fetch Ids of files this user has already completed in this folder
        const completed = await UserProgressModel.find({
            userId: new mongoose.Types.ObjectId(session.user._id),
            folderId: new mongoose.Types.ObjectId(params.folderId),
        })
        .select("fileId")
        .lean();

        const completedFileIds = completed.map(f => String(f.fileId));

        // Delegate to your existing generator
        const plan = await generateStudyPlan(
            params.folderId,
            availableMinutes,
            completedFileIds,
        );

        return successResponse(
            "[Folder Studyplan GET route] studyplan",
            { plan },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Folder Studyplan GET route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Folder Studyplan GET route] Internal Server error",
            500,
            500,
        );
    }
}