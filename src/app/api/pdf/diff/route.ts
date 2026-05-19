/**
 * RESOURCE: PDF Version Diff
 * ---------------------------
 * Endpoint: /api/pdf/diff
 * 
 * ROLE: Compares a newly uploaded PDF against an existing processed folder to detect what
 * changed, what's new, and what's unchanged.
 * 
 * USE CASE: User uploads the 4th edition of the book they aleady have as 3rd edition. Instead of 
 * reprocessing everything, this shows which sections changed and the caller can decide to 
 * re-process only changed sections.
 * 
 * HOW IT WORKS:
 * 1. Parses and chunks the new PDF using the same pipelines as pdf-worker.
 * 2. Computes content hash for each new chunk
 * 3. Compares against existing file hashes stored in MongoDB.
 * 4. Returns: { changed, unchanged, added } with file IDs.
 */
import dbConnect from "@/lib/dbConnect";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { FileModel, FolderModel } from "@/model";
import { parsePDFStructure } from "@/utils/pdf/pdf-structural-parser";
import { findContentStartIndex } from "@/utils/pdf/pdf-content-gate";
import { splitIntoTopicChunks } from "@/utils/pdf/pdf-chunker";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "Unauthorized",
            401,
            401,
        );
        
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const existingFolderId = formData.get("folderId") as string;

        if(!file || !existingFolderId){
            return errorResponse(
                "File and Folder required",
                400,
                400,
            );
        }

        // Get existing files with their hashes
        const existingFiles = await FileModel.find({ folderId: existingFolderId })
            .select("title contentHash blockOrder")
            .lean();
        
        if(existingFiles.length === 0){
            return errorResponse(
                "No existing files found for this folder",
                404,
                404,
            );
        }

        // Parse the new PDF and chunk it
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const folder = await FolderModel.findById(existingFolderId).lean();
        const startOffset = folder?.startOffset || 1;
        const endOffset = folder?.endOffset || 999;

        const PARSE_WINDOW = 20;
        const allBlocks: any[] = [];
        const blockPageMap = new Map<string, number>();

        for(let i = startOffset; i <= endOffset; i += PARSE_WINDOW){
            const windowEnd = Math.min(i + PARSE_WINDOW - 1, endOffset );
            try {
                const pageBlocks = await parsePDFStructure(buffer, i, windowEnd);
                for(const block of pageBlocks){
                    blockPageMap.set(block.id, block.pageNumber ?? i);
                    allBlocks.push(block);
                }
            } catch (error) {
                break; //reached end of pdf
            }
        }

        const contentStartIdx = findContentStartIndex(allBlocks);
        const contentBlocks = allBlocks.slice(contentStartIdx);
        const newChunks = splitIntoTopicChunks(contentBlocks, blockPageMap);

        // Compare new chunks against existing files by content hash
        const diffResults = newChunks.map((chunk, idx) => {
            const contentHashInput = chunk.blocks
                .map((b) => (
                    typeof b.content === "string"
                    ? b.content
                    : JSON.stringify(b.content)
                ))
                .join("|");
            const newHash = crypto
                .createHash("sha256")
                .update(contentHashInput)
                .digest("hex")
                .slice(0, 16);

            const existingFile = existingFiles[idx];

            if(!existingFile){
                return {
                    chunkTitle: chunk.title,
                    status: "added",
                    existingFileId: null,
                    newHash,
                };
            }

            if((existingFile as any).contentHash === newHash){
                return {
                    chunkTitle: chunk.title,
                    status: "unchanged",
                    existingFileId: String(existingFile._id),
                    newHash
                };
            }

            return {
                chunkTitle: chunk.title,
                status: "changed",
                existingFileId: String(existingFile._id),
                newHash,
            };
        });

        const summary = {
            total: diffResults.length,
            unchanged: diffResults.filter((r) => r.status === "unchanged").length,
            changed: diffResults.filter((r) => r.status === "changed").length,
            added: diffResults.filter((r) => r.status === "added").length,
        };

        return successResponse(
            "Diff complete",
            {
                summary,
                details: diffResults,
            },
            200,
            200,
        );
    } catch (error) {
        console.error("[PDF Diff route] Error in pdf diff route: ",error);
        return errorResponse(
            "Error in PDF Diff route",
            500,
            500,
        );
    }
}