import dbConnect from "@/lib/dbConnect"
import FileModel from "@/model/file.model"
import FolderModel from "@/model/folder.model"
import WorkSpaceModel from "@/model/workspace.model"


export async function DELETE(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    if(!fileId){
        return Response.json({
            statusCode: 400,
            message: "File id required",
            success:false
        })
    }

    try {
         // remove file reference from folder 
         const folderUpdate = await FolderModel.updateOne(
            { "files._id": fileId },
            { 
                $pull: { files: { _id: fileId}}
            }
        )
        
        // remove file from workspace
        const workspaceUpdate = await WorkSpaceModel.updateOne(
            { "folders.files._id": fileId },
            {
                $pull: {
                    "folders.$[].files": { _id: fileId }
                }
            }
        )
        if(folderUpdate.modifiedCount === 0 || workspaceUpdate.modifiedCount === 0){
            return Response.json({
                statusCode: 405,
                message: "Failed to remove file reference",
                success: false,
            })
        }

        const deleteFile = await FileModel.findByIdAndDelete(fileId)
        if(!deleteFile){
            return Response.json({
                statusCode: 404,
                message: "Failed to delete the file",
                success: false
            })
        }
       
        
       
        return Response.json({
            statusCode: 200,
            message: "Successfully deleted the file",
            success: true,
            data: { folderUpdate, workspaceUpdate }
        })
    } catch (error) {
        console.log("Error while deleting the file ",error)
        return Response.json({
            statusCode: 500,
            message: "Failed to delete the file",
            success: false
        })
    }

}