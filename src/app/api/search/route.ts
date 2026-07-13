/**
 * GET /api/search?q=<query>&type=all|workspace|folder|file&workspaceId=<optional>
 * --------------------------------------------------------------------------------
 * Global search across ALL workspaces the user owns or is a member of.
 * 
 * What it searches:
 *      - Workspace titles
 *      - Folder titles
 *      - File titles
 *      - File Content via the `plainText` field
 *          ->No Yjs binary decoding. plainText is pre-extracted and sorted.
 *          -> Content matches return a `snippet` (50 chars around the metadata)
 */

export const dynamic = 'force-dynamic';

import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { FileModel, FolderModel, WorkSpaceModel } from "@/model";
import mongoose from "mongoose";

// --- Types ---
export type SearchResultType = "workspace" | "folder" | "file";

export interface SearchResult {
    _id: string;
    type: SearchResultType;
    title: string;
    iconId?: string;
    workspaceId: string;
    workspaceTitle: string;
    folderId?: string;
    folderTitle?: string;
    // True when the match was found in file content, not the title
    matchedInContent?: boolean;
    // ~100-char excerpt around the matching word in plainText
    snippet?: string;
    updatedAt: string;
}

const RESULTS_PER_TYPE = 15;

// --- Snippet extractor ---
// Return ~100 chars around the first occurrence of `query` in 'text'
function extractSnippet(text: string, query: string): string {
    const lower = text.toLowerCase();
    const idx = lower.indexOf(query.toLowerCase());
    if(idx === -1) return text.slice(0, 100) + "...";

    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + query.length + 60);
    const snippet = text.slice(start, end);

    return (start > 0 ? "..." : "") + snippet + (end < text.length ? "..." : "");
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if(!session?.user._id) return errorResponse(
            "[Search GET route] Unauthorized",
            401,
            401,
        );

        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim() ?? "";
        const type = (searchParams.get("type") ?? "all") as SearchResultType | "all";
        const scopedWorkspaceId = searchParams.get("workspaceId");

        // Minimum 2 characters - single chars return too much noise
        if(q.length < 2) return errorResponse(
            "[Seach GET route] Query must be atleast 2 characters",
            400,
            400,
        );

        const userId = session.user._id;

        // Step 1: Find all workspaces this user can access
        const accessibleWorkspaces = await WorkSpaceModel.find({
            $or: [
                { workspace_owner: userId },
                { "members.userId": userId },
            ],
            ...(scopedWorkspaceId && mongoose.Types.ObjectId.isValid(scopedWorkspaceId)
                ? { _id: scopedWorkspaceId }
                : {}),
        })
            .select("_id title iconId")
            .lean();

        if(!accessibleWorkspaces.length) return successResponse(
            "[Search GET route] No results",
            {},
            200,
            200,
        );

        const workspaceIds = accessibleWorkspaces.map((w: any) => w._id);

        // Lookup map: workspaceId -> title
        const workspaceMap = new Map<string, string>(
            (accessibleWorkspaces as any[]).map((w) => [
                w._id.toString(),
                w.title ?? "Untitled Workspace",
            ])
        );

        // Step 2: Safe regex (escape special chars)
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");

        // Step 3: Three parallel queries
        const [ workspaceResults, folderResults, fileResults] = await Promise.allSettled([

            // Workspaces - title only
            (type === "all" || type === "workspace")
                ? (WorkSpaceModel as any).find({
                    _id: { $in: workspaceIds },
                    title: { $regex: regex },
                })
                    .select("_id title iconId updatedAt")
                    .limit(RESULTS_PER_TYPE)
                    .lean()
                : Promise.resolve([]),

            // Folders - title only
            (type === "all" || type === "folder")
                ? (FolderModel as any).find({
                    workspaceId: { $in: workspaceIds },
                    title: { $regex: regex },
                    inTrash: { $ne: true },
                })
                    .select("_id title iconId workspaceId updatedAt")
                    .limit(RESULTS_PER_TYPE)
                    .lean()
                : Promise.resolve([]),

            // Files - title or plainText content
            // One query, $or, no double-fetching
            (type === "all" || type === "file")
                ? (FileModel as any).find({
                    workspaceId: { $in: workspaceIds },
                    inTrash: { $ne: true },
                    $or: [
                        { title: { $regex: regex }},
                        { plainText: { $regex: regex }},
                    ],
                })
                    .select("_id title iconId workspaceId folderId plainText updatedAt lastupdated")
                    .limit(RESULTS_PER_TYPE)
                    .lean()
                : Promise.resolve([]),
        ]);

        const results: SearchResult[] = [];

        // Step 4: Shape workspace results
        if(workspaceResults.status === "fulfilled"){
            for(const ws of workspaceResults.value as any[]){
                results.push({
                    _id: ws._id.toString(),
                    type: "workspace",
                    title: ws.title ?? "Untitled Workspace",
                    iconId: ws.iconId,
                    workspaceId: ws._id.toString(),
                    workspaceTitle: ws.title ?? "Untitled Workspace",
                    updatedAt: ws.updatedAt.toISOString() ?? "",
                });
            }
        }

        // Step 4: Shape folder results
        if(folderResults.status === "fulfilled"){
            for(const folder of folderResults.value as any[]){
                const wsId = folder.workspaceId?.toString() ?? "";
                const wsTitle = workspaceMap.get(wsId);
                if(!wsTitle) continue;

                results.push({
                    _id: folder._id.toString(),
                    type: "folder",
                    title: folder.title ?? "Untitled",
                    iconId: folder.iconId,
                    workspaceId: wsId,
                    workspaceTitle: wsTitle,
                    updatedAt: folder.updatedAt?.toISOString() ?? "",
                });
            }
        }

        // Step 6: Shape file results
        if(fileResults.status === "fulfilled"){
            const files = fileResults.value as any[];

            if(files.length > 0){
                // Batch fetch parent folder titles - single $in query, no n+1
                const folderIds = Array.from(
                    new Set(
                        files.map((f: any) => f.folderId?.toString()).filter(Boolean)
                    )
                );

                const parentFolders = await (FolderModel as any)
                    .find({ _id: { $in: folderIds }})
                    .select("_id title")
                    .lean();

                const folderTitleMap = new Map<string, string>(
                    (parentFolders as any[]).map((f: any) => [
                        f._id.toString(),
                        f.title ?? "Untitled",
                    ])
                );

                for(const file of files){
                    const wsId = file.workspaceId?.toString() ?? "";
                    const wsTitle = workspaceMap.get(wsId);
                    if(!wsTitle) continue;

                    const folderId = file.folderId?.toString() ?? "";
                    const titleMatches = regex.test(file.title ?? "");

                    // Determine if this was a content match (not just title)
                    const contentMatches = !titleMatches && file.plainText && regex.test(file.plainText);

                    results.push({
                        _id: file._id.toString(),
                        type: "file",
                        title: file.title ?? "Untitled",
                        iconId: file.iconId,
                        workspaceId: wsId,
                        workspaceTitle: wsTitle,
                        folderId,
                        folderTitle: folderTitleMap.get(folderId),
                        matchedInContent: !!contentMatches,
                        // Only includes snippet for content matches
                        snippet: contentMatches
                            ? extractSnippet(file.plainText!, q)
                            : undefined,
                        updatedAt: (file.lastUpdated ?? file.updatedAt)?.toISOString() ?? "",
                    });
                }
            }
        }

        // Step 7: Sort
        // Title matches before content matches, then by most recently updated
        results.sort((a, b) => {
            const aContent = a.matchedInContent ? 1 : 0;
            const bContent = b.matchedInContent ? 1 : 0;
            if(aContent !== bContent) return aContent - bContent; //title matches first
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return successResponse(
            "[Search GET route] Search results",
            results,
            200,
            200,
        );
    } catch (error: any) {
        console.error("[Search GET route] Failed: ",error);
        return errorResponse(
            "[Search GET route] Internal Server Error",
            500,
            500,
        );
    }
}