import dbConnect from "@/lib/dbConnect";
import{ FileModel, FolderModel, WorkSpaceModel} from "@/model/index";



export async function GET( request: Request ){
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
    // console.log("Query params ",queryParams)

    try {
        const workspaces = await WorkSpaceModel.find({ workspace_owner: queryParams.userId }).lean();
        // console.log("[route] check-user-have-created-workspace: workspaces:", workspaces);

        return Response.json({
            statusCode: 200,
            message: "Workspace is present under the current user",
            success: true,
            data: workspaces
        }, {status: 200})
        
    } catch (error) {
        console.log("Error while finding the workspace under the current user ",error)
        return Response.json({
            statusCode: 500,
            message: error,
            success: false
        }, {status: 500 })
    }
}
