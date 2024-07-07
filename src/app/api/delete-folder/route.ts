import dbConnect from "@/lib/dbConnect"
import FolderModel from "@/model/folder.model"
import WorkSpaceModel from "@/model/workspace.model"


export async function DELETE(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    if(!folderId){
        return Response.json({
            statusCode: 400,
            message: "Folder id required",
            success:false
        })
    }

    try {
         // remove folder from workspace 
         const workspaceUpdate = await WorkSpaceModel.updateOne(
            { "folders._id": folderId },
            { 
                $pull: { folders: { _id: folderId }}
            }
        )
        if(workspaceUpdate.modifiedCount === 0){
            return Response.json({
                statusCode: 405,
                message: "Failed to remove the folder reference",
                success: false
            })
        }
        const deleteFolder = await FolderModel.findByIdAndDelete(folderId)
        if(!deleteFolder){
            return Response.json({
                statusCode: 404,
                message: "Failed to delete the folder",
                success: false
            })
        }
       
        return Response.json({
            statusCode: 200,
            message: "Successfully deleted the folder",
            success: true,
            data: workspaceUpdate
        })
    } catch (error) {
        console.log("Error while deleting the folder ",error)
        return Response.json({
            statusCode: 500,
            message: "Failed to delete the folder",
            success: false
        })
    }

}