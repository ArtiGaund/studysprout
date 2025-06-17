import dbConnect from "@/lib/dbConnect"
import {FolderModel} from "@/model/index"
import { AnyExpression } from "mongoose"

export async function GET(request: Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        folderId: searchParams.get('folderId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "No folder id present",
            success: false
        })
    }
    const folderId = queryParams.folderId
    try {
        const folder = await FolderModel.findById({
            _id: folderId
        })
        if(!folder){
            return Response.json({
                statusCode: 404,
                 message: "No folder from this id present",
                success: false
            }, { status: 404})
        }
        return Response.json({
            statusCode: 200,
             message: "Successfully fetched current folder",
             data: folder,
            success: true
        }, { status: 200 })
    } catch (error: AnyExpression) {
         console.error("Error while fetching current folder:", error);

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