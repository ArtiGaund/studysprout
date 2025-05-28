import dbConnect from "@/lib/dbConnect";
import FileModel from "@/model/file.model";
import FolderModel from "@/model/folder.model";
import UserModel from "@/model/user.model";
import WorkSpaceModel from "@/model/workspace.model";

export async function DELETE(request: Request){
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if(!userId){
        return Response.json({
            statusCode: 400,
            message: "User id required",
            success:false
        })
    }
    // Delete all related data
    const delete_user = await Promise.all([
         WorkSpaceModel.deleteMany({ workspace_owner: userId }),
        FolderModel.deleteMany({ workspace_owner: userId }),
        FileModel.deleteMany({ workspace_owner: userId }),
        UserModel.deleteOne({ _id: userId }),
        ])

        if(!delete_user){
            return Response.json({
                statusCode: 400,
                message: "Failed to delete user. Please try again",
                success:false
            })
        }
        return Response.json({
            statusCode: 200,
            message: "Account successfully",
            success:true
        })
}