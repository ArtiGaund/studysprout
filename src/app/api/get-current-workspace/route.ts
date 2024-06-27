import dbConnect from "@/lib/dbConnect"
import WorkSpaceModel from "@/model/workspace.model"

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
                statusCode: 401,
                 message: "No workspace from this id present",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
             message: "Successfully fetched current workspace",
             data: workspace,
            success: true
        })
    } catch (error) {
        console.log("Error while fetching current workspace ",error)
        return Response.json({
            statusCode: 500,
             message: "Error while fetching current workspace",
            success: false
        })
    }
}