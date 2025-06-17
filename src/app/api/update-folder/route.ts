import dbConnect from "@/lib/dbConnect";
import {FolderModel, WorkSpaceModel} from "@/model/index";

import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
             // 1. Validate Folder ID
            if(!_id){
                return Response.json({
                    statusCode: 400,
                    message: "Bad Request: Folder ID is required and must be a valid ObjectId.",
                    success: false
                }, { status: 400 })
            }
            const folderId = new mongoose.Types.ObjectId(_id);
             // 2. Update the Folder document directly
            const folder = await FolderModel.findByIdAndUpdate(
                folderId,
                updates,
                { new: true, runValidators: true }
            ).lean();
            if(!folder){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to update data in folder",
                    success: false
                }, { status: 405})
            }   


            return Response.json({
                statusCode: 200,
                message: "Updated data in folder sucessfully. ",
                success: true,
                data: {folder}
            }, { status: 200 })
    } catch (error: any) {
        console.error("Error while updating the folder:", error);

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
                message: "Bad Request: Invalid folder ID format provided.",
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