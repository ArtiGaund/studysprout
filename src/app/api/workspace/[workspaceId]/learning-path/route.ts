import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { assignLevels } from "@/app/api/folder/[folderId]/learning-path/route";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, WorkSpaceModel } from "@/model";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(
    _req: NextRequest,
    { params }: { params: { workspaceId: string }}
){
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
            "WorkspaceId is required",
            400,
            400,
        );

        const workspace = await WorkSpaceModel.findById(workspaceId, {
            conceptGraph: 1,
        }).lean();

        const graph = workspace?.conceptGraph;

        if(!graph || graph.nodes.length < 2) return successResponse(
            "Learning Path for workspace",
            {
                learningPath: [],
                reason: "concept_graph_not_built",
            },
            200,
            200,
        )
        
        const prereqMap = new Map<string, string[]>();
        for(const node of graph.nodes){
            prereqMap.set(node.id, []);
        }
        for(const edge of graph.edges){
            const existing = prereqMap.get(edge.source) ?? [];
            existing.push(edge.target);
            prereqMap.set(edge.source, existing);
        }
        const folderIds = graph.nodes.map(n => n.id);
        const levels = assignLevels(folderIds, prereqMap);

        const learningPath = graph.nodes.map(node => ({
            id: node.id,
            title: node.label,
            prerequisites: prereqMap.get(node.id) ?? [],
            level: levels.get(node.id) ?? 0,
            fileCount: node.fileCount,
        })).sort((a, b) => a.level - b.level);

        return successResponse(
            "Learning path for workspace",
            {
                learningPath,
            },
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Learning Path route of workspace] Failed to get learning path of workspace: ",
            error.message
        );
        return errorResponse(
            error.message ?? "Internal Server error",
            500,
            500,
        );
    }
}