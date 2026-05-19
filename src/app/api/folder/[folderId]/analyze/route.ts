/**
 * RESOURCE: Folder Intelligence Analyzer
 * ---------------------------------------
 * Endpoint: POST /api/folder/[folderId]/analyzer
 * 
 * ROLE: Runs concept graph + prerequisite detection for any folder.
 * Works for Both folders and normal editor folders.
 * 
 * WHAT IT DOES:
 * 1. Concept graph (One Gemini call for the whole folder) - finds concepts that appear across
 * multiple files. Stored on the Folder document.
 * 2. Prerequisite detection (Zero AI cost) - finds which files reference terms defined in earlier
 * files. Stored on each File document.
 * 
 * Both run in parallel via Promise.allSettled - if one fails, the other still saves. Neither 
 * failure blocks the reponse
 * 
 * WHEN TO CALL:
 * - For PDF folders: automatically called by pdf-worker after processing
 * - For normal editor folders: user triggers via "Analyze folder" button
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, FolderModel } from "@/model";
import { buildFolderConceptGraph } from "@/utils/intelligence/concept-graph-builder";
import { detectFilePrerequisites } from "@/utils/intelligence/prerequisite-detector";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(
    request: NextRequest,
    { params }: { params: { folderId: string}}
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
            "No folder id found",
            400,
            400,
        );

        const folder = await FolderModel.findById(folderId).lean();
        if(!folder) return errorResponse(
            "No folder found in database",
            400,
            400,
        );

        const workspaceId = folder.workspaceId;
        if(!workspaceId){
            return errorResponse(
                "Workspace Id required",
                400,
                400,
            )
        }

        const files = await FileModel.find({ folderId })
            .select("_id blocks blockOrder plainText")
            .lean();

        if(files.length < 2){
            return errorResponse(
                "Need atleast 2 files to analyze relationship",
                400,
                400,
            );
        }

        const fileIds = files.map((f) => String(f._id));

        // Run both in parallel - concept graph needs Gemini, prerequisites does not
        const [ graph, prereqs ] = await Promise.allSettled([
            buildFolderConceptGraph(fileIds, workspaceId),
            detectFilePrerequisites(fileIds, workspaceId ),
        ]);

        // Save concept graph to folder
        if(graph.status === "fulfilled"){
            await FolderModel.findByIdAndUpdate(folderId, {
                $set: { conceptGraph: graph },
            });
        }

        // Save prerequisites to each file
        if(prereqs.status === "fulfilled"){
            await Promise.all(
                prereqs.value.map(({ fileId, prerequisites }) => {
                    FileModel.findByIdAndUpdate(fileId, {
                        $set: { prerequisites },
                    })
                })
            );
        }

        return successResponse(
            "Folder analyzed successfully",
            {
                conceptGraph: graph.status === "fulfilled" ? graph.value : null,
                prerequisites: prereqs.status === "fulfilled" ? prereqs.value : null,
                errors: {
                    conceptGraph: graph.status === "rejected" ? graph.reason?.message : null,
                    prerequisites: prereqs.status === "rejected" ? prereqs.reason?.message : null,
                },
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Folder Analyze] Error: ",error);
        return errorResponse(
            error.message,
            500,
            500,
        );
    }
}