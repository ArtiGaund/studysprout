import dbConnect from "@/lib/dbConnect";
import {FolderModel,WorkSpaceModel } from "@/model/index";

import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const folderData = await request.json();
        // 1. Validate incoming data for required fields
        if (!folderData || !folderData.title || !folderData.workspaceId) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: 'title' and 'workspaceId' are required to create a folder.",
                success: false
            }, { status: 400 });
        }
         // Validate if workspaceId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(folderData.workspaceId)) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid 'workspaceId' format.",
                success: false
            }, { status: 400 });
        }
        // 2. Create the new folder document
        const newFolder = await FolderModel.create(folderData)
        if(!newFolder){
            // This case is unlikely if validation passes, but good as a safeguard
            return Response.json({
                statusCode: 500, // Internal Server Error
                message: "Failed to create new folder due to a server error.",
                success: false
            }, { status: 500 });
        }
        
         // 3. Update the parent workspace to include the new folder's reference
         const updatedWorkspace = await WorkSpaceModel.findByIdAndUpdate(
            folderData.workspaceId,
            { $push: { folders: newFolder._id } },
            { new: true }
         ).lean();
         // If the workspace specified in folderData.workspaceId does not exist
        if (!updatedWorkspace) {
            // Rollback: Delete the created folder if its parent workspace doesn't exist
            await FolderModel.findByIdAndDelete(newFolder._id);
            return Response.json({
                statusCode: 404, // Not Found, as the parent workspace doesn't exist
                message: `Workspace with ID '${newFolder.workspaceId}' not found. Folder not created.`,
                success: false
            }, { status: 404 });
        }

        // console.log("Added folder in workspace ",workspace)
        // 4. Return success response with the newly created folder and updated workspace info
        return Response.json({
            statusCode: 201, // 201 Created is the appropriate status for successful resource creation
            message: "Folder created successfully and added to workspace.",
            success: true,
            data: { 
                folder: newFolder.toObject(), // Convert to plain object if not already by .create()
                updatedWorkspace: updatedWorkspace 
            }
        }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating new folder:", error);
        // Handle Mongoose validation errors or other unexpected issues
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return Response.json({
                statusCode: 400,
                message: `Validation Error: ${messages.join(', ')}`,
                success: false
            }, { status: 400 });
        }

        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}
