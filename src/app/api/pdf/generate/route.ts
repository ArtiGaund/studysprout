/**
 * RESOURCE: PDF Generation Initiator
 * -----------------------------------
 * Endpoint: POST /api/pdf/generate
 * 
 * ROLE: Validates the request, uploads PDF to cloudinary, creates Folder in MongoDB, queue BullMQ
 * job. Return folderId immediately.
 * All actual processing happens in the background (pdf-worker.ts)
 * 
 */


// Also increase the Max Duration if you are on a hobby plan (optional but helpful)
export const maxDuration = 60;

import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { uploadToCloudinary } from "@/lib/cloudinary-utils/upload-and-delete-from-cloudinary";
import { FolderModel, WorkSpaceModel } from "@/model";
import { Folder as MongooseFolder } from "@/model/folder.model";
import { pdfQueue } from "@/lib/bullmq/queue";
import { createPDFFingerprint } from "@/utils/pdf/pdf-fingerprint";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest){
    await dbConnect();
    try {
        const session = await getServerSession(authOptions);
        if(!session){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const title = formData.get("title") as String;
        const workspaceId = formData.get("workspaceId") as String;
        const startOffset = parseInt(formData.get("startOffset") as string) || 1;
        const endOffset = parseInt(formData.get("endOffset") as string);
        const pageCount = parseInt(formData.get("pageCount") as string);
        const pdfType = (formData.get("pdfType") as string || "notes");

        if(!file) return errorResponse(
            "No file provided",
            400,
            400,
        );

        if(!workspaceId) return errorResponse(
            "Workspace Id is required",
            400,
            400,
        );

        // --- DUPLICATE DETECTION -----------------
        // Hash first 10KB + file size. If same PDF already processed in this workspace, 
        // return existing file instead of re-processing
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fingerprint = createPDFFingerprint(buffer);
        

        // Check if this exist PDF was already processed in this workspace
        const existingFolder = await FolderModel.findOne({
            workspaceId: String(workspaceId),
            pdfFingerprint: fingerprint,
            status: {
                $in: [ "completed", "processing" ],
            },
        });

        if(existingFolder){
            // Return the existing folder instead of processing again
            return successResponse(
                "PDF already processed",
                {
                    folderId: existingFolder._id,
                    alreadyExists: true,
                },
                200,
                200,
            );
        }
        // 1. Upload the PDF so that BullMQ Worker can access it later
        const cloudinaryResponse: any = await uploadToCloudinary(file, "studysprout-pdfs");
        const pdfUrl = cloudinaryResponse.secure_url;

        // 2. Create the Folder with the new fields
        const newfolderData: MongooseFolder = {
            title: file.name.replace(".pdf", ""),
            workspaceId: String(workspaceId),
            isPDFWorkspace: true,
            status: "processing",
            pdfUrl: pdfUrl,
            pageCount: parseInt(formData.get("pageCount") as string),
            createdAt: new Date(),
            iconId: '📁',
            data: undefined,
            inTrash: undefined,
            bannerUrl: '',
            pdfFingerprint: fingerprint,
            startOffset,
            endOffset,
            pdfType: pdfType as "book" | "research" | "slides" | "notes",
        }
        const newfolder = await FolderModel.create(newfolderData);

        if(!newfolder){
            return errorResponse(
                "Failed to create new folder",
                400,
                400,
            );
        }

        // Add the folder in Workspace
        await WorkSpaceModel.findByIdAndUpdate(workspaceId, {
            $push: {
                folders: newfolder._id
            }
        });

        // ----QUEUE BACKGROUND JOB ----------------------
        // 3. Handle off to BullMQ
        await pdfQueue.add("process-pdf", {
            folderId: newfolder._id,
            pdfUrl: pdfUrl,
            userId: session.user._id,
            workspaceId: String(workspaceId),
            pageCount: parseInt(formData.get("pageCount") as string),
            startOffset,
            endOffset,
            title,
            pdfType,
        });

        const data = {
            folderId: newfolder._id
        }
        return successResponse(
            "Processing started",
            data,
            200,
            200
        )
    } catch (error: any) {
        console.error("[PDF generate] Error: ",error);
        return errorResponse(
            error.message,
            500,
            500
        )
    }
}