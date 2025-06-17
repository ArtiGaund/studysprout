import dbConnect from "@/lib/dbConnect"
import {FileModel} from "@/model/index"
import { AnyConnectionBulkWriteModel } from "mongoose"

export async function GET(request: Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        fileId: searchParams.get('fileId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "No file id present",
            success: false
        })
    }
    const fileId = queryParams.fileId
    try {
        const file = await FileModel.findById({
            _id: fileId
        })
        if(!file){
            return Response.json({
                statusCode: 404,
                 message: "No file from this id present",
                success: false
            }, { status: 404})
        }
        return Response.json({
            statusCode: 200,
             message: "Successfully fetched current file",
             data: file,
            success: true
        }, { status: 200})
    } catch (error: any) {
         console.error("Error while fetching current file:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid ID format provided for file.",
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