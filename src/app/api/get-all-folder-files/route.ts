import dbConnect from "@/lib/dbConnect";
import { FolderModel, FileModel } from "@/model/index";
import mongoose from "mongoose";


export async function GET(request: Request){
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const queryParams = {
            folderId: searchParams.get('folderId')
    }
    if(!queryParams){
             return Response.json({
                statusCode: 405,
                 message: "No folder id present",
                success: false
            })
    }
    const folderId = queryParams.folderId;
     // 1. Validate 'folderId' presence and format
    if (!folderId) {
        return Response.json({
            statusCode: 400, // Bad Request
            message: "Bad Request: 'folderId' query parameter is required.",
            success: false
        }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return Response.json({
            statusCode: 400, // Bad Request
            message: "Bad Request: Invalid 'folderId' format.",
            success: false
        }, { status: 400 });
    }

    // console.log("Registered models:", mongoose.modelNames());
    try {
        const folder = await FolderModel.findById(folderId).populate('files');
        // console.log("Populated files : ",folder?.files);
         
        if(!folder){
            return Response.json({
                statusCode: 404,
                 message: "No folder of this id found in the database",
                success: false
            }, { status: 404 })
        }
        // 3. Sort files by createdAt date
        const fileData = folder.files
        ? folder.files.sort((a: any,b: any) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
        // 4. Return success response
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched all files for the folder.",
            data: fileData,
            success: true
        }, { status: 200 });
    } catch (error: any) {
         console.error("Error while fetching all folder files:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid ID format provided for folder.",
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