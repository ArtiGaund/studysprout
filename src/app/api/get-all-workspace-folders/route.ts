import dbConnect from "@/lib/dbConnect";
import WorkSpaceModel from "@/model/workspace.model";


export async function GET(request: Request){
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
    // console.log("Workspace Id ",workspaceId)
    try {
        const workspace = await WorkSpaceModel.findById({
            _id : workspaceId
        })
        // console.log("Workspace ",workspace)
        const foldersData = workspace?.folders.sort((a,b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
        if(foldersData?.length === 0){
            return Response.json({
                statusCode: 400,
                message: "Workspace don't have folders",
                success: false,
            })
        }
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched all folders for this workspace",
            success: true,
            data: foldersData
        })
    } catch (error) {
        console.log("Error while fetching the folders for the workspace ",error)
        return Response.json({
            statusCode: 500,
            message: "Failed to fetched all folders for this workspace",
            success: false,
        })
    }
}
