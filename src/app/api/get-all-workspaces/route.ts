import dbConnect from "@/lib/dbConnect";
// import UserModel from "@/model/user.model";
import WorkSpaceModel from "@/model/workspace.model";



export async function GET(request: Request){
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
    const userId = queryParams.userId
    // console.log("user Id from get all workspace ",userId)
    try {
        const workspaces = await WorkSpaceModel.find({
            workspace_owner: userId
        }).sort({ createdAt: 1})
        if(workspaces?.length === 0){
            return Response.json({
                statusCode: 400,
                message: "User don't have any workspace",
                success: false,
            })
        }
        // console.log("Workspaces in get all workspace ",workspaces)
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched all workspaces for the user",
            success: true,
            data: workspaces
        })
    } catch (error) {
        console.log("Error while fetching the workspaces for the user ",error)
        return Response.json({
            statusCode: 500,
            message: "Failed to fetched all workspace for the user",
            success: false,
        })
    }
}