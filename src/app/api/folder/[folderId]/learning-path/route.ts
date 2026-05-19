/**
 * What it does: 
 *      1. Fetches file.prerequisites for all files in the folder from MongoDB
 *      2. Runs topological sort to assign reading levels
 *      3. Returns ordered learning path with file titles
 *
 */

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { rebuildTermIndex } from "@/lib/workers/workspace-term-index";
import { FileModel, FolderModel } from "@/model";
import { detectFilePrerequisites } from "@/utils/intelligence/prerequisite-detector";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Topological sort -> assigns a "level" (depth) to each files
// Level 0 = no prerequisites (read first)
// Level N = depends on files at level 0...N-1

export function assignLevels(
    fileIds: string[],
    prereqMap: Map<string, string[]>
): Map<string, number>{
    const levels = new Map<string, number>();
    const fileSet = new Set(fileIds);

    const getLevel = (id: string, visited = new Set<string>()): number => {
        if(levels.has(id)) return levels.get(id)!;
        if(visited.has(id)) return 0;  //cycle guard

        visited.add(id);
        const prereqs = (prereqMap.get(id) ?? []).filter(p => fileSet.has(p));

        if(prereqs.length === 0){
            levels.set(id, 0);
            return 0;
        }

        const maxPrereqLevel = Math.max(...prereqs.map(p => getLevel(p, visited)));
        const level = maxPrereqLevel + 1;
        levels.set(id, level);
        return level;
    }

    for(const id of fileIds) getLevel(id);
    return levels;
}

function buildResponse(files: any[], fileIds: string[]){
    const prereqMap = new Map<string, string[]>(
        files.map(f => [String(f._id), (f.prerequisites ?? []).map(String)])
    );

    const levels = assignLevels(fileIds, prereqMap);

    const learningPath = files.map( f => {
        const id = String(f._id);
        return {
            id,
            title: f.title || "Untitled",
            prerequisites: (f.prerequistes ?? []).map(String),
            level: levels.get(id) ?? 0,
        };
    }).sort((a, b) => a.level - b.level); //sort by level ascending
    return learningPath;
}
export async function GET(
    _req: NextRequest,
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

        const { folderId } = params;
        if(!folderId) return errorResponse(
            "FolderId is required",
            400,
            400,
        );

        const folder = await FolderModel.findById(folderId, {
            files: 1,
            workspaceId: 1,
        }).lean();

        if(!folder) return errorResponse(
            "Folder not found",
            404,
            404,
        );

        const fileIds = (folder.files ?? []).map(String);
        if(fileIds.length < 2){
            return successResponse(
                "Learning path",
                {
                    learningPath: []
                },
                200,
                200,
            );
        }

        const workspaceId = String(folder.workspaceId ?? "");

        // Fetch existing prerequisites from DB
        const files = await FileModel.find(
            { 
                _id: { $in: fileIds },
            },
            {
                _id: 1,
                title: 1,
                prerequisites: 1,
            }
        ).lean();

        // Check if prerequisites have been generated yet
        const allEmpty = files.every(f => !(f.prerequisites as any[])?.length);

        if(allEmpty){
            // Prerequisites not generated yet for this normal folder
            // Generate them now on-demand
            await rebuildTermIndex(workspaceId);
            const result = await detectFilePrerequisites(fileIds, workspaceId);

            await Promise.all(
                result.map(({ fileId, prerequisites }) => 
                    FileModel.findByIdAndUpdate(fileId, {
                        $set:{ prerequisites }
                    })
                )
            );

            // Reload with fresh prerequisites
            const refreshed = await FileModel.find(
                { _id: { $in: fileIds } },
                { 
                    _id: 1,
                    title: 1,
                    prerequisites: 1,
                }
            ).lean();

            const learningPath = buildResponse(refreshed, fileIds);
            return successResponse(
                "Learning Path",
                {
                    learningPath,
                },
                200,
                200
            );
        }

        const learningPath = buildResponse(files, fileIds);
        return successResponse(
            "Learning Path",
            {
                learningPath,
            },
            200,
            200,
        );
    } catch (error) {
        console.error("[Learning path route] Failed: ",error);
        return errorResponse(
            "Internal server error",
            500,
            500,
        );
    }
}