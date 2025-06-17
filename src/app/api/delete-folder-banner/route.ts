import dbConnect from "@/lib/dbConnect";
// import { deleteImageFromCloud } from "@/lib/image-handler/upload-and-delete-image-cloudinary";
import {FolderModel, WorkSpaceModel} from "@/model/index";
import ImageModel from "@/model/image.model";
import mongoose from "mongoose";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";


export async function DELETE(request:Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
      // 1. Validate folderId
    if(!folderId || !mongoose.Types.ObjectId.isValid(folderId)){
        return Response.json({
            statusCode: 400,
            message: "Folder id required",
            success:false
        }, { status: 400 })
    }
    try {
        // 2. Find the folder to get its current bannerUrl (ImageModel _id)
       
        const folder = await FolderModel.findById(folderId)

        if(!folder){
            return Response.json({
                statusCode: 404,
                message: "folder not found in database",
                success: false
            }, { status: 404 })
        }

        const imageToDelete = folder.bannerUrl;
        if(!imageToDelete){
            return Response.json({
                statusCode: 200,
                message: "Folder has no banner image to delete.",
                success: true
            }, { status: 200 });
        }


        // 3. Resolve ImageModel _id to Cloudinary public_id and delete image
        const publicIdsToProcess: (string | mongoose.Types.ObjectId)[] = [imageToDelete];
        const imageModels = await ImageModel.find({ _id: { $in: publicIdsToProcess.filter(id =>
             mongoose.Types.ObjectId.isValid(id)) } }).select('public_id').lean();
        const actualCloudinaryPublicIds = imageModels.map(img => img.public_id);
        if(actualCloudinaryPublicIds.length > 0){
            await imageDeletion(actualCloudinaryPublicIds);
        }else{
            console.warn(`Folder ${folderId} had bannerUrl ${imageToDelete} but no corresponding ImageModel found.`);
        }


        // 4. update the folder
        const updatedFolder = await FolderModel.findOneAndUpdate(
            new mongoose.Types.ObjectId(folderId),
            { $set: { bannerUrl: null } },
            { new: true }
        ).lean();

        if (!updatedFolder) {
            // This case should ideally not happen if file was found initially, but good as a safeguard
            return Response.json({
                statusCode: 500, // Internal Server Error
                message: "Failed to clear bannerUrl on the folder document.",
                success: false
            }, { status: 500 });
        }
      

    return Response.json({
        statusCode: 200,
        message: "Successfully deleted banner for the folder",
        success: true,
        data: updatedFolder
    })
    } catch (error: any) {
         console.error("Error while deleting file banner:", error);
        // Log the error and return a generic 500
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}