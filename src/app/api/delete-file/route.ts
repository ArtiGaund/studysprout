import dbConnect from "@/lib/dbConnect"
import ImageModel from "@/model/image.model"
import {FileModel, FolderModel, WorkSpaceModel} from "@/model/index"
import { imageDeletion } from "@/lib/image-handler/imageDeletion"
import mongoose from "mongoose"



export async function DELETE(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
     // 1. Validate fileId
    if(!fileId){
        return Response.json({
            statusCode: 400,
            message: "File id required",
            success:false
        })
    }
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return Response.json({
            statusCode: 400,
            message: "Bad Request: Invalid 'fileId' format.",
            success: false
        }, { status: 400 });
    }

    try {
        // Find the file first to get its details, including any associated images, before deleting it
        const fileToDelete = await FileModel.findById(fileId).lean();
        console.log("File to delete ",fileToDelete);
        if(!fileToDelete){
             return Response.json({
                statusCode: 404,
                message: "File not found.",
                success: false
            }, { status: 404 });
        }

        // 2. collect image public_ids associated with this file (if any)
        const imagePublicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [];

        // if file have bannerur or logo field that stores an imageModel _id
        if(fileToDelete.bannerUrl){
            imagePublicIdsToDelete.push(fileToDelete.bannerUrl);
        }

        // 3. delete associated images from cloudinary and imageModel
        if(imagePublicIdsToDelete.length > 0){
            const imageModels = await ImageModel.find(
                { _id: { $in: imagePublicIdsToDelete.filter(id => 
                    mongoose.Types.ObjectId.isValid(id)
                )}}
            ).select('public_id').lean();
            const actualCloudinaryPublicIds = imageModels.map(image => image.public_id);
            await imageDeletion(actualCloudinaryPublicIds);
        }
         // 4. remove file reference from parent folder 
         const folderUpdateResult = await FolderModel.updateOne(
            { files: new mongoose.Types.ObjectId(fileId) }, //find folder that contain this fileId
            { $pull: { files: new mongoose.Types.ObjectId(fileId) } } //Pull the objectId from the array
        );
        
        if(folderUpdateResult.modifiedCount === 0){
            console.warn(`File reference ${fileId} not found or already removed from any folder.`);
            return Response.json({
                statusCode: 405,
                message: "Failed to remove file reference",
                success: false,
            }, { status: 405});
        }

        //5. delete file document itself
        const deleteFile = await FileModel.findByIdAndDelete(fileId)
        if(!deleteFile){
            return Response.json({
                statusCode:  500,
                message: "Failed to delete the file",
                success: false
            }, { status:  500})
        }
       
        
       
        return Response.json({
            statusCode: 200,
            message: "Successfully deleted the file",
            success: true,
            data: { folderUpdateResult }
        }, { status: 200 })
    } catch (error: any) {
        console.log("Error while deleting the file ",error.message)
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 })
    }

}