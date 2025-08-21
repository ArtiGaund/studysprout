import dbConnect from "@/lib/dbConnect";
import { FileModel, WorkSpaceModel } from "@/model";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await dbConnect();
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
        try {
            // 2. Find the Workspace and populate its folders
        // Then, for each populated folder, populate its files.
            const workspace = await WorkSpaceModel.findById(workspaceId)
            .populate({
                path: 'folders',
                model: 'Folder',
                populate: {
                    path: 'files',
                    model: 'File',
                    match: { 
                        inTrash: { $in: [undefined, null, ""]  }
                    }
                }
            }).exec();
                if(!workspace){
                return Response.json({
                    statusCode: 404,
                    message: "No workspace of this id found in the database",
                    success: false
                }, { status: 404 })
        }
        // 3. Extract all files from the populated folders
          let allFiles: typeof FileModel[] = [];
          workspace?.folders?.forEach(( folder: any) => {
            if(folder.files && Array.isArray(folder.files)){
                allFiles = allFiles.concat(folder.files)
            }
          });

          return Response.json({
            statusCode: 200,
            message: "Successfully fetched all files for the workspace.",
            data: allFiles,
            success: true
        }, { status: 200 });
        } catch (error: any) {
             console.error("Error while fetching all workspace files:", error);

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