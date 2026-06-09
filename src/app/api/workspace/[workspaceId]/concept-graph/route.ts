import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { onSynthesisCompleted } from "@/lib/activity-hooks";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, WorkSpaceModel } from "@/model";
import { buildWorkspaceConceptGraph } from "@/utils/intelligence/concept-graph-builder";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(
    _req: NextRequest,
    { params }: { params: { workspaceId: string }}
) {
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "Unauthorized",
            401,
            401,
        );

        const { workspaceId } = params;
        if(!workspaceId) return errorResponse(
            "WorkspaceId required",
            400,
            400,
        );

        const graph = await buildWorkspaceConceptGraph(workspaceId);
    
        const updatedWorkspace = await WorkSpaceModel.findByIdAndUpdate(
            workspaceId,
            {
                $set: {
                    conceptGraph: graph,
                    conceptGraphStale: false,
                }
            },
            { new: true }
        ).lean();

        await onSynthesisCompleted(
            workspaceId,
            String(session.user._id),
            graph.nodes.length ?? 0,
            updatedWorkspace?.title ?? "Workspace",
        );

        return successResponse(
            "Workspace concept graph built",
            updatedWorkspace,
            200,
            200,
        )
    } catch (error: any) {
        console.error("[Workspace concept graph route] Failed to build concept graph of workspace: ",
            error.message);
        return errorResponse(
            error.message ?? "Internal server error",
            500,
            500,
        )
    }
}