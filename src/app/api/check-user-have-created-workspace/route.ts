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
        const hasWorkspace = await WorkSpaceModel.exists({ workspace_owner: queryParams.userId })

        if(!hasWorkspace){
            return Response.json({
                statusCode: 201,
                message: "No workspace found with the current user",
                success: true,
                data: false,
            },{ status: 201})
        }
        return Response.json({
            statusCode: 200,
            message: "Workspace is present under the current user",
            success: true,
            data: true
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
