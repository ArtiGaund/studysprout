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
        // Find the first workspace owned by the user
        // Deeply populate the folders and files to return full nested objects.
        const workspace = await WorkSpaceModel.findOne({
            workspace_owner: queryParams.userId
        })
        .populate({
            path: 'folders', //path to the folders array in workspace schema
            model: FolderModel, //Mongoose model for folders
            populate: {
                path: 'files', // path to the files array within each folders
                model: FileModel //Mongoose model for files
            }
        })
        .lean(); //Convert mongoose document to a plain javascript object for efficiency

        if(!workspace){
            return Response.json({
                statusCode: 400,
                message: "No workspace found with the current user",
                success: false
            }, { status: 404})
        }

        return Response.json({
            statusCode: 200,
            message: "Workspace is present under the current user",
            success: true,
            data: workspace
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