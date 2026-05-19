/**
 * RESOURCE: Content Simplifier
 * -----------------------------
 * Endpoint: /api/file/[fileId]/simplify
 * 
 * ROLE: Simplifies complex file content into plain language using Gemini.
 * 
 * WHY GEMINI IS WORTH IT HERE:
 * This is genuine language transformation - turning dense acedamic prose, legal language, or 
 * technical documentation into plain language.
 * Can't be done this with string processing.
 * 
 * COST CONTROL: 
 * Results are cached on the File document (simplifiedContent field).
 * Gemini is NOT called again unless content changes (simplificationOutdated: true)
 * The file-sync-worker sets simplificationOutdated: true on every content save.
 * 
 * DOMAIN-AGNOSTIC:
 * Works for research papers, legal documents, technical specs, medical notes, financial reports-
 * anything complex, targetAudience parameter lets users specify who will read the simplified 
 * version.
 */
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { callGeminiText } from "@/lib/ai/flashcards/gemini-client";
import { buildSimplificationPrompt } from "@/lib/ai/flashcards/system-instruction";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import dbConnect from "@/lib/dbConnect";
import { FileModel } from "@/model";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(
    request: NextRequest,
    { params }: { params: { fileId: string }}
){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "Unauthorized",
            401,
            401,
        );

        const fileId = params.fileId;
        if(!fileId) return errorResponse(
            "File id is required",
            400,
            400,
        );

        const file = await FileModel.findById(fileId).lean();
        if(!file) return errorResponse(
            "No File found in database",
            400,
            400,
        );

        // Already have simplified version and content hasn't changed, returned cashed
        // Prevents duplicate Gemini calls 
        if((file as any).simplifiedContent && !(file as any).simplicationOutdated){
            return successResponse(
                "Simplified content (cached)",
                {
                    simplified: (file as any).simplifiedContent,
                    fromCached: true,
                },
                200,
                200,
            );
        }

        const blockOrder = file.blockOrder as string[];
        const blocksRaw = file.blocks as any; 

        // Build the full text from blocks
        const fullText = blockOrder
            .map((bid: string) => {
                const block = blocksRaw instanceof Map
                    ? blocksRaw.get(bid)
                    : blocksRaw?.[bid];
                return (block?.plainText || block?.content || "") as string;
            })
            .filter(Boolean)
            .join("\n\n");

        if(fullText.length < 100){
            return errorResponse(
                "File content too short to simplify",
                400,
                400,
            );
        }

        // ---This prompt is profession-agnostic---
        // Work for research paper, legal documents, technical docs, medical papers, financial
        // reports - anything complex.
        const { targetAudience } = await request.json().catch(() => {});

        const audienceContext = targetAudience
            ? `The reader is: ${targetAudience}`
            : "The reader has no prior knowledge of this topic.";

        const prompt = buildSimplificationPrompt(fullText, targetAudience);

        const simplified = await callGeminiText(prompt, 2048);
        if(!simplified) return errorResponse(
            "Simplification failed",
            500,
            500,
        )

        // Cached result
        await FileModel.findByIdAndUpdate(fileId, {
            $set: {
                simplifiedContent: simplified,
                simplificationOutdated: false,
                simplifiedAt: new Date(),
            },
        });

        return successResponse(
            "Content Simplified",
            {
                simplified,
                fromCached: false,
            },
            200,
            200,
        );

    } catch (error: any) {
        console.error("[Simplify route] Failed to simplify: ",error);
        return errorResponse(
            error.message,
            500,
            500,
        );
    }
}