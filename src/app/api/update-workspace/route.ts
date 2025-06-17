import dbConnect from "@/lib/dbConnect";
import {WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
              // 1. Validate Workspace ID
            if(!_id){
                return Response.json({
                    statusCode: 401,
                    message: "Bad Request: Workspace ID is required and must be a valid ObjectId.",
                    success: false
                }, { status: 401})
            }
            const workspaceId = new mongoose.Types.ObjectId(_id);

           
            // 2. Update the Workspace
            const workspace = await WorkSpaceModel.findByIdAndUpdate(
                workspaceId,
                updates,
                { new: true, runValidators: true }
            ).lean()
            if(!workspace){
                return Response.json({
                    statusCode: 405,
                    message: "Failed to update data in workspace",
                    success: false
                }, { status: 405})
            }   


            return Response.json({
                statusCode: 200,
                message: "Updated data in workspace sucessfully. ",
                success: true,
                data: workspace
            }, { status: 200 })
    } catch (error: any) {
       console.error("Error while updating the Workspace:", error);

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
                message: "Bad Request: Invalid workspace ID format provided.",
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