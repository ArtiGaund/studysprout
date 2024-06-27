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
                statusCode: 405,
                 message: "No workspace id present",
                success: false
            })
    }
    const workspaceId = queryParams.workspaceId
    console.log("Workspace Id in get-all-workspace-folders ",workspaceId)
    try {
        const workspace = await WorkSpaceModel.findById(workspaceId)
        if(!workspace){
            return Response.json({
                statusCode: 401,
                message: "No workspace of this id found in the database",
                success: false
            })
        }
        console.log("Workspace in get all workspace folders ",workspace)
        const foldersData = workspace?.folders?.sort((a,b) => {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
        console.log("Folders in get-all-workspace-folders ",foldersData)
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched all the folders for the workspace",
            data: foldersData,
            success: true
        })
    } catch (error) {
        console.log("Error while get all workspace folders ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while get all workspace folders",
            success: false
        })
    }
}


// const { searchParams } = new URL(request.url)
// const queryParams = {
//     workspaceId: searchParams.get('workspaceId')
// }
// if(!queryParams){
//      return Response.json({
//         statusCode: 405,
//          message: "No workspace id present",
//         success: false
//     })
// }
// const workspaceId = queryParams.workspaceId
// console.log("Workspace Id in get-all-workspace-folders ",workspaceId)
// try {
//     // const workspace = WorkSpaceModel.findOne({
//     //     _id: workspaceId
//     // })
//     // if(!workspace){
//     //     return Response.json({
//     //         statusCode: 401,
//     //          message: "No workspace from this id present",
//     //         success: false
//     //     })
//     // }
//     // console.log("Workspace in get all workspace folders ",workspace)
//     // const foldersData = workspace?.folders?.sort((a,b) => {
//     //     return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//     // })
//     // console.log("Folders in get-all-workspace-folders ",foldersData)
//     // if(foldersData?.length === 0){
//     //     return Response.json({
//     //         statusCode: 400,
//     //         message: "Workspace don't have folders",
//     //         success: false,
//     //     })
//     // }
//     return Response.json({
//         statusCode: 200,
//         message: "Successfully fetched all folders for this workspace",
//         success: true,
//         data: workspace
//     })
// } catch (error) {
//     console.log("Error while fetching the folders for the workspace ",error)
//     return Response.json({
//         statusCode: 500,
//         message: "Failed to fetched all folders for this workspace",
//         success: false,
//     })
// }