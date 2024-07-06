import dbConnect from "@/lib/dbConnect"
import WorkSpaceModel from "@/model/workspace.model"


export async function DELETE(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    if(!workspaceId){
        return Response.json({
            statusCode: 400,
            message: "Workspace id required",
            success:false
        })
    }

    try {
        const deleteWorkspace = await WorkSpaceModel.findByIdAndDelete(workspaceId)
        if(!deleteWorkspace){
            return Response.json({
                statusCode: 404,
                message: "Failed to delete the workspace",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
            message: "Successfully deleted the workspace",
            success: true
        })
    } catch (error) {
        console.log("Error while deleting the workspace ",error)
        return Response.json({
            statusCode: 500,
            message: "Failed to delete the workspace",
            success: false
        })
    }

}