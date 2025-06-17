import dbConnect from "@/lib/dbConnect";
// import UserModel from "@/model/user.model";
import {WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";



export async function GET(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        userId: searchParams.get('userId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "Unauthorized",
            success: false
        })
    }
    const userId = queryParams.userId
     // 1. Validate 'workspaceId' presence and format
         if (!userId) {
                 return Response.json({
                     statusCode: 400, // Bad Request
                     message: "Bad Request: 'userId' query parameter is required.",
                     success: false
                 }, { status: 400 });
             }
         
             if (!mongoose.Types.ObjectId.isValid(userId)) {
                 return Response.json({
                     statusCode: 400, // Bad Request
                     message: "Bad Request: Invalid 'userId' format.",
                     success: false
                 }, { status: 400 });
             }
    // console.log("user Id from get all workspace ",userId)
    try {
        const workspaces = await WorkSpaceModel.find({
            workspace_owner: userId
        }).sort({ createdAt: 1})
        if(workspaces?.length === 0){
            return Response.json({
                statusCode: 404,
                message: "User don't have any workspace",
                success: false,
            }, { status: 404})
        }
        // console.log("Workspaces in get all workspace ",workspaces)
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched all workspaces for the user",
            success: true,
            data: workspaces
        }, { status: 200})
    } catch (error: any) {
         console.error("Error while fetching all user workspaces:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid ID format provided for user.",
                success: false
            }, { status: 400 });
        }

        // Generic internal server error
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}