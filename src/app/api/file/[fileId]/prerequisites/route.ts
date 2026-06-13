import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { rebuildTermIndex } from "@/lib/workers/workspace-term-index";
import { FileModel } from "@/model";
import { detectFilePrerequisites } from "@/utils/intelligence/prerequisite-detector";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(
    _req: NextRequest,
    { params }: { params: { fileId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "[File Prerequisites route] Unauthorized",
            401,
            401,
        );

        const { fileId } = params;
        // Load the file to get its folderId and workspaceId
        const file = await FileModel.findById(fileId, {
            _id: 1,
            folderId: 1,
            workspaceId: 1,
            prerequisites: 1,
        }).lean();

        if(!file) return errorResponse(
            "[File Prerequisites route] File not found",
            400,
            400,
        );

        // Get all sibling files in the same folder (need context for term matching)
        const siblings = await FileModel.find(
            { folderId: file.folderId },
            { _id: 1 }
        ).lean();

        const allFileIds = siblings.map(f => String(f._id));

        if(allFileIds.length < 2){
            return successResponse(
                "[File Prerequisites route] Prerequisites",
                {
                    prerequisites: [],
                },
                200,
                200,
            );
        }

        const workspaceId = String(file.workspaceId);

        await rebuildTermIndex(workspaceId);

        // Detect across all sibling files
        const results = await detectFilePrerequisites(allFileIds, workspaceId);
    
        // Find this file's result and save it
        const thisFileResult = results.find(r => String(r.fileId) === String(fileId));
        const prerequisites = thisFileResult?.prerequisites ?? [];
        
        await FileModel.findByIdAndUpdate(fileId, {
            $set: { prerequisites },
        });

        const prereqFiles = await FileModel.find(
            { 
                _id: { $in: prerequisites },
            },
            {
                _id: 1,
                title: 1,
            },
        ).lean();

        return successResponse(
            "[File Prerequisites route] Prerequsites detected",
            {
                prerequisites: prereqFiles.map(f => ({ id: String(f._id), title: f.title})),
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[File Prerequisites route] Error: ",error.message);
        return errorResponse(
            error.message ?? "[File Prerequisites route]Internal Server Error",
            500,
            500,
        );
    }
}