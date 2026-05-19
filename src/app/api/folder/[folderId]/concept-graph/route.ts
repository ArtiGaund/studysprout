import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { rebuildTermIndex } from "@/lib/workers/workspace-term-index";
import { FolderModel } from "@/model";
import { buildFolderConceptGraph } from "@/utils/intelligence/concept-graph-builder";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

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
        if(!folderId) return errorResponse(
            "Folder id is required",
            400,
            400,
        );

        const folder = await FolderModel.findById(folderId).lean();
        if(!folder) return errorResponse(
            "Folder not found in database",
            400,
            400,
        );
        const fileIds = folder?.files?.map(String);
        if(!fileIds){
            return successResponse(
                "No files in folder",
                200,
                200,
            )
        }

        if(fileIds.length < 2){
            return errorResponse(
                "Need at least 2 files to build a concept graph",
                406,
                406,
            );
        }
        const workspaceId = folder.workspaceId;
        if(!workspaceId){
            return errorResponse(
                "WorkspaceId is required",
                400,
                400,
            );
        }

        await rebuildTermIndex(workspaceId);

        const graph = await buildFolderConceptGraph(fileIds, workspaceId);

        const updatedFolder = await FolderModel.findByIdAndUpdate(folderId, {
            $set: {
                conceptGraph: graph,
                conceptGraphStale: false,
                conceptGraphStatus: "idle", //reset the status
            },
        }, { new: true }).lean();

        const data = { updatedFolder }
        
        return successResponse(
            "Concept graph built",
            data,
            200,
            200,
        );
    } catch (error) {
        console.error("[Concept graph route] Failed: ",error);
    }
}