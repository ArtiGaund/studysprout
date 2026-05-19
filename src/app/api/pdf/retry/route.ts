/**
 * RESOURCE: PDF Job Retry
 * -------------------------
 * Endpoint: POST /api/pdf/retry
 * 
 * Role: Re-queue a failed PDF processing job without requiring re-upload.
 * 
 * WHY THIS EXISTS:
 * When a BullMQ job failed (PDF.js crash, timeout, network error), the folder status becomes 
 * "error". The user previously has no choice but to re-upload.
 * Since we store pdfUrl + startOffset + endOffset on the Folder document, we can re-queue the
 * exact same job from stored data.
 * 
 * ONLY works if the folder has status "error" - prevent re-running completed or processing 
 * folders accidently.
 */
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { pdfQueue } from "@/lib/bullmq/queue";
import dbConnect from "@/lib/dbConnect";
import { FolderModel } from "@/model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST(request: Request){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session) return errorResponse(
            "Unauthorized",
            401,
            401,
        );
        const { folderId, workspaceId } =await request.json();
        const folder = await FolderModel.findById(folderId);

        if(!folder){
            return errorResponse(
                "Folder not found",
                400,
                400,
            );
        }

        if(folder.status !== "error"){
            return errorResponse(
                "Only failed folders can be retried",
                400,
                400,
            );
        }
        // Validate that we have everything needed to re-queue
        if(!folder.pdfUrl || !folder.startOffset || !folder.endOffset){
            return errorResponse(
                "Folder is missing required data for retry. Please re-upload",
                400,
                400,
            );
        }

        // Reset folder state
        await FolderModel.findByIdAndUpdate(folderId, {
            $set: {
                status: "processing",
                currentFileCount: 0,
            },
        });

        // Re-queue the exact same job - no re-upload needed 
        await pdfQueue.add("process-pdf", {
            folderId: folder._id,
            pdfUrl: folder.pdfUrl,
            pageCount: folder.pageCount,
            workspaceId: workspaceId || String(folder.workspaceId),
            userId: session.user._id,
            startOffset: folder.startOffset,
            endOffset: folder.endOffset,
            title: folder.title,
            pdfType: folder.pdfType || "notes",
        });

        return successResponse(
            "Retry queued successfully",
            { folderId },
            200,
            200,
        );
    } catch (error) {
        console.error("[PDF Retry Route] Error in Retry: ",error);
        throw error;
    }
}