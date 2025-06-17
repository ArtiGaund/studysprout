import dbConnect from "@/lib/dbConnect";
import {FileModel, FolderModel, WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const fileData = await request.json();
         if(!fileData || !fileData.title || !fileData.folderId){
            return Response.json({
                statusCode: 400,
                message: "Bad Request: 'title' and 'folderId' are required to create a file.",
                success: false
            }, { status: 400})
        }
         // check if the provided folderId is a valid mongodb objectId
        if(!mongoose.Types.ObjectId.isValid(fileData.folderId)){
            return Response.json({
                statusCode: 400,
                message: "Bad Request: 'folderId' is not a valid ObjectId.",
                success: false
            }, { status: 400})
        }
        // creating a new file
        const newFile = await FileModel.create(fileData)
        
        if(!newFile){
            return Response.json({
                statusCode: 500,
                message: "Failed to create new file, please try again later.",
                success: false
            }, { status: 500})
        }
        
        //    update the parent folder to include the new file's reference 
        const updatedFolder = await FolderModel.findByIdAndUpdate(
            fileData.folderId,
            { 
                $push: {
                    files: newFile._id,
                }
            },
            { new: true }
        ).lean(); 

        // If the folder specified in fileData.folderId does not exist
        if(!updatedFolder){
            // Rollback: Delete the created file if its parent folder does'nt exist
            await FileModel.findByIdAndDelete(newFile._id)
            return Response.json({
                statusCode: 404,
                 message: `Folder with ID '${fileData.folderId}' not found. File not created.`,
                success: false
            }, { status: 404 });
        }

        // find the folder and update it with the new file
        const folderId = newFile.folderId
        const folder = await FolderModel.findById(folderId)
        if(!folder){
           await FileModel.findByIdAndDelete(newFile._id)
            // const deletingFolder = await FolderModel.findByIdAndDelete(newFolder._id)
            return Response.json({
                statusCode: 400,
                message: "Folder id is required",
                success: false
            })
        }

    
        return Response.json({
            statusCode: 201, // 201 Created is the appropriate status for successful resource creation
            message: "File created successfully and added to folder.",
            success: true,
            data: { 
                file: newFile.toObject(), // Convert to plain object if not already by .create()
                updatedFolder: updatedFolder 
            }
        }, { status: 201 });


        // console.log("Added folder in workspace ",workspace)
      
    } catch (error: any) {
         console.error("Error creating new file:", error);
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