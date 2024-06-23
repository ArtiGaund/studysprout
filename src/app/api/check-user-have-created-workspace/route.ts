import dbConnect from "@/lib/dbConnect";
import WorkSpaceModel from "@/model/workspace.model";



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

        const workspace = await WorkSpaceModel.findOne({
            workspace_owner: queryParams.userId
        })

        if(!workspace){
            return Response.json({
                statusCode: 400,
                message: "No workspace found with the current user",
                success: false
            })
        }

        return Response.json({
            statusCode: 200,
            message: "Workspace is present under the current user",
            success: true,
            data: workspace
        })
        
    } catch (error) {
        console.log("Error while finding the workspace under the current user ",error)
        return Response.json({
            statusCode: 500,
            message: error,
            success: false
        })
    }
}