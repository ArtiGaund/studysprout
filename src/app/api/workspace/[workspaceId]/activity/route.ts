/**
 * GET /api/workspace/[workspaceId]/activity?limit=4
 * -> Returns the 4 most recent events (for the workspace page view)
 * 
 * GET /api/workspace/[workspaceId]/activity?page=1&limit=20&type=SYNTHESIS_COMPLETED&folderId=xxx
 * -> Paginated, filtered list (for the "View All Activity" page)
 * 
 * POST /api/workspace/[workspaceId]/activity
 * -> Write a new event (called internally from other routes)
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { ActivityEventModel } from "@/model";
import mongoose, { mongo } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { workspaceId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Workspace activity GET route] Unauthorized",
            401,
            401,
        );

        const { workspaceId } = params;
        if(!workspaceId) return errorResponse(
            "[Workspace activity GET route] workspace id is required",
            400,
            400,
        );

        const { searchParams } = new URL(request.url);

        const limit = Math.min(parseInt(searchParams.get("limit") ?? "4"), 50);
        const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
        const type = searchParams.get("type");
        const folderId = searchParams.get("folderId");

        const filter: Record<string, any> = {
            workspaceId: new mongoose.Types.ObjectId(workspaceId),
        };

        if(type) filter.type = type;
        if(folderId) filter.folderId = new mongoose.Types.ObjectId(folderId);

        const skip = ( page - 1 ) * limit;

        const [ events, total ] = await Promise.all([
            ActivityEventModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityEventModel.countDocuments(filter),
        ]);

        return successResponse(
            "[Workspace activity GET route] Recent activity",
            {
                events,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total/ limit),
                    hasNextPage: skip + limit < total,
                },
            },
            200,
            200,
        )
    } catch (error: any) {
        console.error("[Workspace activity GET route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Workspace activity GET route] Internal Server Error",
            500,
            500,
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { workspaceId: string }}
) {
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Workspace activity POST route] Unauthorized",
            401,
            401,
        );

        const body = await request.json();
        const {
            type,
            description,
            folderId,
            fileId,
            metadata,
        } = body;

        if(!type || !description){
            return errorResponse(
                "[Workspace activity POST route] Type and description are required",
                400,
                400,
            );
        }

        const event = await ActivityEventModel.create({
            workspaceId: new mongoose.Types.ObjectId(params.workspaceId),
            userId: new mongoose.Types.ObjectId(session.user._id),
            folderId: folderId ? new mongoose.Types.ObjectId(folderId) : null,
            fileId: fileId ? new mongoose.Types.ObjectId(fileId) : null,
            type,
            description,
            metadata: metadata ?? {},
        });

        return successResponse(
            "[Workspace activity route] POST Created event",
            {
                event
            },
            200,
            200,
        )
    } catch (error: any) {
        console.error("[Workspace activity POST route] Failed: ",error.message);
        return errorResponse(
            error.message ?? "[Workspace activity POST route] Internal Server Error",
            500,
            500,
        )
    }
}