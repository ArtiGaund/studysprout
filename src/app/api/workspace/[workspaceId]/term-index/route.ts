/**
 * GET /api/workspace/[workspaceId]/term-index
 * 
 * Returns the workspace term index enriched with file titles, so the frontend useBacklinks hook
 * can display human-readable file name in tooltips.
 * 
 * Response shape:
 * {
 *      termIndex: {
 *          "vector space": [{ id: "fileId1", title: "Chapter 1 - Vector Space "}],
 *          "eigenvalue": [{ id: "fileId3", title: "Chapter 3 - Eigen Value"}],
 *      }
 * }
 * 
 * Caching:
 *      Caching-control: public, max-age=60- client caches for 60 s.
 *      The hook fetches once per editor session anyway, so stale-while-revalidate covers rapid
 *      navigation between files.
 */

import { BacklinkFile } from "@/hooks/intelligence/useBacklinks";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, WorkSpaceModel } from "@/model";
import { NextRequest } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: { params: { workspaceId: string }}
){
    try {
        const { workspaceId } = params;
        if(!workspaceId){
            return errorResponse(
                "Missing workspaceId",
                400,
                400,
            );
        }

        await dbConnect();

        // Load raw term index
        const workspace = await WorkSpaceModel.findById(workspaceId, {
            termIndex: 1,
        }).lean();

        if(!workspace){
            return errorResponse(
                "Workspace not fount",
                404,
                404,
            );
        }

        const rawIndex = (workspace.termIndex ?? {}) as Record<string, string[]>;

        // Collect all unique fileIds referenced 
        const allFileIds = Array.from(
            new Set(Object.values(rawIndex).flat())
        );

        // Bulk-fetch titles
        const fileDocs = await FileModel.find(
            { _id: { $in: allFileIds }},
            { _id: 1, title: 1 },
        ).lean();

        const titleMap = new Map<string, string>(
            fileDocs.map((f) => [String(f._id), f.title as string ])
        );

        // Build enriched index
        const enrichedIndex: Record<string, BacklinkFile[]> = {};

        for(const [ term, fileIds ] of Object.entries(rawIndex)){
            const files: BacklinkFile[] = fileIds
                    .map((id) => ({ id, title: titleMap.get(id) ?? "Untitled" }))
                    .filter((f) => f.title !== undefined);

            if(files.length > 0){
                enrichedIndex[term] = files;
            }
        }

        return successResponse(
            "Successfully fetched term index",
            {
                termIndex: enrichedIndex,
            },
            200,
            200,
        )
    } catch (error) {
        console.error("[Term Index route] error in term index route: ",error);
    }
}