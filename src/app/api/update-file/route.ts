/**
 * POST /api/update-file
 * 
 * This route is used to update a file
 * 
 * Responsibility:
 * - Validate request payload (fileId, updates).
 * - Find the file.
 * - Apply updates directly to the Mongoose Document instance.
 * - Save the file.
 * 
 * Notes:
 * - This route is used to update a file

 */
import { computeHash } from "@/lib/compute-hash";
import dbConnect from "@/lib/dbConnect";
import { bumpFileVersion } from "@/lib/file/bumpFileVersion";
import {FileModel, FolderModel, WorkSpaceModel} from "@/model/index";
// import { refreshPlainTextContent } from "@/utils/fileProcessingUtils";
// import { getAggregatedPlainText } from "@/utils/flashcardTextExtractor";
import mongoose from "mongoose";

type FileUpatePayload ={
    _id: string;
    title?: string;
    iconId?: string;
    bannerUrl?: string;
    folderId?: string;
    inTrash?: string;
    workspaceId?: string;

    conflictState?: "none" | "conflict" | "resolved";
    isLocked?: boolean;
}
export async function POST(request: Request) {
    await dbConnect()
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
            // 1. Validate File ID
            if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
                return Response.json({
                    statusCode: 400, // Bad Request
                    message: "Bad Request: File ID is required and must be a valid ObjectId.",
                    success: false
                }, { status: 400 });
            }
            const fileId = new mongoose.Types.ObjectId(_id);
            // 2. Find the original document
            let file = await FileModel.findById(fileId);



            if(!file){
                return Response.json({
                statusCode: 404, // Not Found
                message: "File not found in the database.",
                success: false
            }, { status: 404 });
            }

        //    apply allowed updates explicitly
        if(updates.title !== undefined) file.title = updates.title;
        if(updates.iconId !== undefined) file.iconId = updates.iconId;
        if(updates.bannerUrl !== undefined) file.bannerUrl = updates.bannerUrl;
        if(updates.folderId !== undefined) file.folderId = updates.folderId;
        if(updates.inTrash !== undefined) file.inTrash = updates.inTrash;   
        if(updates.workspaceId !== undefined) file.workspaceId = updates.workspaceId;
        if(updates.conflictState !== undefined) file.conflictState = updates.conflictState;
        if(updates.isLocked !== undefined) file.isLocked = updates.isLocked;

           // updating file version
                  bumpFileVersion(file);
            // 4. Await the save operation
           await file.save();

            
        
             return Response.json({
                statusCode: 200,
                message: "File updated successfully.",
                success: true,
                data: file,
            }, { status: 200 });
    } catch (error: any) {
        console.error("Error while updating the file:", error);

        // Handle specific Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return Response.json({
                statusCode: 400,
                message: `Validation Error: ${messages.join(', ')}`,
                success: false
            }, { status: 400 });
        }
        // Handle CastError for invalid ObjectId if it wasn't caught earlier
        if (error.name === 'CastError' && error.path === '_id') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid file ID format provided.",
                success: false
            }, { status: 400 });
        }

        return Response.json({
            statusCode: 500, // Internal Server Error
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}