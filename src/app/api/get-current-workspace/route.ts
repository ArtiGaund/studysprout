import dbConnect from "@/lib/dbConnect"
import {WorkSpaceModel} from "@/model/index"

export async function GET(request: Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        workspaceId: searchParams.get('workspaceId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "No workspace id present",
            success: false
        })
    }
    const workspaceId = queryParams.workspaceId

    try {
        const workspace = await WorkSpaceModel.findById({
            _id: workspaceId
        })
        if(!workspace){
            return Response.json({
                statusCode: 404,
                 message: "No workspace from this id present",
                success: false
            }, { status: 404 })
        }
        return Response.json({
            statusCode: 200,
             message: "Successfully fetched current workspace",
             data: workspace,
            success: true
        }, { status: 200})
    } catch (error: any) {
         console.error("Error while fetching current workspace:", error);

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