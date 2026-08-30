import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { isValidId } from "@/helpers/validateId";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel, InboxItemModel } from "@/model";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";

interface BlockNoteBlock{
    id: string;
    type: string;
    props?: Record<string, any>;
    content: Array<{
        type: string;
        text: string;
        styles: Record<string, any>;
    }>;
};

const TYPE_MAP: Record<string, string> = {
    heading1: "heading",
    heading2: "heading",
    heading3: "heading",
    paragraph: "paragraph",
    bullet_list: "bulletListItem",
    numbered_list: "numberedListItem",
    code: "codeBlock",
    quote: "quote",
};

const LEVEL_MAP: Record<string, number> = {
    heading1: 1,
    heading2: 2,
    heading3: 3,
};

function parseInboxContentToBlocks(type: string, content: string){
    const lines = content
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const numberedRegex = /^(\d+)[\.\)]\s*/;
    const bulletRegex = /^[•\-\*]\s*/;

    if(type === "numbered_list" || type === "NUMBERED_LIST"){
        return lines.map((line) => ({
            id: crypto.randomUUID(),
            type: "numberedListItem",
            content: [{
                type: "text",
                text: line.replace(numberedRegex, ""),
                styles: {},
            }],
        }));
    }

    if(type === "bullet_list" || type === "BULLET_LIST"){
        return lines.map((line) => ({
            id: crypto.randomUUID(),
            type: "bulletListItem",
            content: [{
                type: "text",
                text: line.replace(bulletRegex, ""),
                styles: {},
            }],
        }));
    }

    if(type === "list" || type === "LIST"){
        return lines.map((line) => {
            const isNumbered = numberedRegex.test(line);
            return {
                id: crypto.randomUUID(),
                type: isNumbered ? "numberedListItem" : "bulletListItem",
                content: [
                    {
                        type: "text",
                        text: line.replace(isNumbered ? numberedRegex : bulletRegex, ""),
                        styles: {},
                    }
                ],
            };
        });
    }

    // Standalone Blocks (Headings, Paragraphs, Quotes, Code)
    const blockType = TYPE_MAP[type] ?? "paragraph";
    const props = LEVEL_MAP[type] ? { level: LEVEL_MAP[type] } : {};

    return [
        {
            id: crypto.randomUUID(),
            type: blockType,
            ...(Object.keys(props).length > 0 ? { props } : {}),
            content: [{ type: "text", text: content, styles: {} }],
        },
    ];
}

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL;

export async function POST(
    request: NextRequest,
    { params }: { params: { inboxId: string }}
){
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        if(!session?.user._id){
            return errorResponse(
                "[Inbox Merge POST route] Unauthorized to merge an inbox item",
                401,
                401,
            );
        }

        const { inboxId } = params;
        if(!isValidId(inboxId)) return errorResponse(
            "[Inbox Merge POST route] Invalid inbox Id",
            400,
            400,
        );

        const body = await request.json();
        const { fileId } = body;

        if(!fileId || !isValidId(fileId)) return errorResponse(
            "[Inbox Merge POST route] A valid fileId is required",
            400,
            400,
        );

        // 1. Find the inbox item - scoped to this user, so no cross-user access
        const inboxItem = await InboxItemModel.findOne({
            _id: inboxId,
            userId: session.user._id,
        });
        if(!inboxItem) return errorResponse(
            "[Inbox Merge POST route] Inbox item not found or not yours",
            404,
            404,
        );

        // 2.Confirm the target file exists (existence + ownership check only)
        const file = await FileModel.findById(fileId);
        if(!file) return errorResponse(
            "[Inbox Merge POST route] Target file not found",
            404,
            404,
        );

        // 3. Build a block descriptor from the inbox item
        const blocksToInsert = parseInboxContentToBlocks(inboxItem.type, inboxItem.content);

        // 4. Hand off to the realtime server - it owns the live Yjs doc, broadcasts to any 
        // active viewers, and queues persistence through the same FileSyncWorker pipeline live
        // edits use, so blocks, blockOrder, plainText, readingTimeMinutes, autoSummary, and
        // terms are all recomputed consistently rather than partially/manually set here.
        if(!REALTIME_URL){
            return errorResponse(
                "[Inbox Merge POST route] Realtime server URL not configured",
                500,
                500,
            );
        }

        const applyRes = await fetch(`${REALTIME_URL}/emit/apply-inbox-block`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fileId: String(file._id),
                userId: String(session.user._id),
                workspaceId: String(file.workspaceId),
                blocks: blocksToInsert,
            }),
        });

        if(!applyRes.ok){
            const errorBody = await applyRes.text().catch(() => "");
            console.warn(`[Inbox Merge POST route] Realtime server rejected apply-inbox-block: 
                ${applyRes.status} ${errorBody}`);
            return errorResponse(
                "[Inbox Merge POST route] Failed to apply block to file",
                502,
                502,
            );
        }

        // 5. Delete the inbox item - only after the file write succeeded
        await InboxItemModel.findByIdAndDelete(inboxId);

        return successResponse(
            "[Inbox Merge POST route] Inbox item merged into file",
            { 
                fileId: String(fileId), 
                workspaceId: String(file.workspaceId),
                folderId: String(file.folderId),
                fileTitle: file.title || "Untitled",
                blocks: blocksToInsert 
            },
            200,
            200,
        );
    } catch (error: any) {
        console.warn(error.message ?? "[Inbox Merge POST route] Internal Server Error");
        return errorResponse(
            error.message ?? "[Inbox Merge POST route] Internal Server Error",
            500,
            500,
        );
    }
}