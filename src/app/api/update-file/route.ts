import dbConnect from "@/lib/dbConnect";
import {FileModel, FolderModel, WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
            // console.log("updated data ",updatedData);
            // 1. Validate File ID
            if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
                return Response.json({
                    statusCode: 400, // Bad Request
                    message: "Bad Request: File ID is required and must be a valid ObjectId.",
                    success: false
                }, { status: 400 });
            }
            const fileId = new mongoose.Types.ObjectId(_id);
            // 2. Update the File document directly
            const file = await FileModel.findByIdAndUpdate(
                fileId,
                updates,  // Pass the entire updates object directly
                { new: true, runValidators: true } // Return updated document, run schema validators
            ).lean();

            if(!file){
                return Response.json({
                statusCode: 404, // Not Found
                message: "File not found in the database.",
                success: false
            }, { status: 404 });
            }
        
             return Response.json({
                statusCode: 200,
                message: "File updated successfully.",
                success: true,
                data: { file } 
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