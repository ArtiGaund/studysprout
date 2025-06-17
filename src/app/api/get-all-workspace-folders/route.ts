import dbConnect from "@/lib/dbConnect";
import {WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";


export async function GET(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
            workspaceId: searchParams.get('workspaceId')
    }
    if(!queryParams){
             return Response.json({
                statusCode: 405,
                 message: "No workspace id present",
                success: false
            })
    }
    const workspaceId = queryParams.workspaceId
     // 1. Validate 'workspaceId' presence and format
     if (!workspaceId) {
             return Response.json({
                 statusCode: 400, // Bad Request
                 message: "Bad Request: 'workspaceId' query parameter is required.",
                 success: false
             }, { status: 400 });
         }
     
         if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
             return Response.json({
                 statusCode: 400, // Bad Request
                 message: "Bad Request: Invalid 'workspaceId' format.",
                 success: false
             }, { status: 400 });
         }
    // console.log("Workspace Id in get-all-workspace-folders ",workspaceId)
    try {
        const workspace = await WorkSpaceModel.findById(workspaceId).populate('folders')
        if(!workspace){
            return Response.json({
                statusCode: 404,
                message: "No workspace of this id found in the database",
                success: false
            }, { status: 404 })
        }
        // console.log("Workspace in get all workspace folders ",workspace)
         // 3. Sort files by createdAt date
        const foldersData = workspace?.folders
        ? workspace.folders.sort((a: any,b: any) => 
                 new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];

        
        // console.log("Folders in get-all-workspace-folders ",foldersData)
        // 4. Return success response
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched all files for the folder.",
            data: foldersData,
            success: true
        }, { status: 200 });
    } catch (error: any) {
         console.error("Error while fetching all workspace folders:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid ID format provided for workspace.",
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


