import dbConnect from "@/lib/dbConnect";
import { deleteImageFromCloud } from "@/lib/upload-image";
import FolderModel from "@/model/folder.model";
import ImageModel from "@/model/image.model";
import WorkSpaceModel from "@/model/workspace.model";


export async function DELETE(request:Request) {
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
        // taking out folder
        const folder = await FolderModel.findById(folderId)

        if(!folder){
            return Response.json({
                statusCode: 401,
                message: "folder not found in database",
                success: false
            })
        }

        const imageId = folder.bannerUrl

        const image = await ImageModel.findById(imageId)

        if(!image){
            return Response.json({
                statusCode: 401,
                message: "Image not found in database",
                success: false
            })
        }

        const public_id = image.public_id

        // deleting image from cloud
        if(public_id){
            const deleteFromCloud = await deleteImageFromCloud(public_id)
            if(!deleteFromCloud){
                return Response.json({
                    statusCode: 401,
                    message: "Failed to delete image from cloudinary",
                    success: false
                })
            }
        }

        const deleteImage = await ImageModel.findByIdAndDelete(image._id)
        if(!deleteImage){
            return Response.json({
                statusCode: 401,
                message: "Failed to delete image from database",
                success: false
            })
        }

        folder.bannerUrl = ""

       // update the workspace
       const workspace = await WorkSpaceModel.findOneAndUpdate(
        { "folders._id": folder._id },
        {
            $set: {
                "folders.$.bannerUrl": folder.bannerUrl
            }
        }
    )

    if(!workspace){
        return Response.json({
            statusCode: 405,
            message: "Failed to update in workspace",
            success: false
        })
    }

    //  save the folder
    await folder.save()

    // save the workspace
    await workspace.save()

    return Response.json({
        statusCode: 200,
        message: "Successfully deleted banner for the folder",
        success: true,
        data: { folder, workspace }
    })
    } catch (error) {
        console.log("Error while deleting banner for the folder ",error)
        return Response.json({
            statusCode: 500,
            message: "Error while deleting banner for the folder",
            success: false
        })
    }
}