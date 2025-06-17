import dbConnect from "@/lib/dbConnect";
// import { deleteImageFromCloudinary } from "@/lib/image-handler/upload-and-delete-image-cloudinary";
import {FileModel, FolderModel, WorkSpaceModel} from "@/model/index";

import ImageModel from "@/model/image.model";
import mongoose from "mongoose";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";


export async function DELETE(request:Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
     // 1. Validate fileId
    if(!fileId|| !mongoose.Types.ObjectId.isValid(fileId)){
        return Response.json({
            statusCode: 400,
            message:  "Bad Request: Valid 'fileId' query parameter is required.",
            success:false
        }, { status: 400 })
    }
    try {
        // 2. Find the file to get its current bannerUrl (ImageModel _id)
        const file = await FileModel.findById(fileId)

        if(!file){
            return Response.json({
                statusCode: 401,
                message: "File not found in database",
                success: false
            }, { status: 404 })
        }

        const imageIdToDelete = file.bannerUrl

         // If there's no banner image associated, just return success
        if(!imageIdToDelete){
            return Response.json({
                statusCode: 200,
                message: "File has no banner image to delete.",
                success: true
            }, { status: 200 });
        }

        // 3. Resolve ImageModel _id to Cloudinary public_id and delete image
         const imagePublicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [imageIdToDelete];
         const imageModels = await ImageModel.find( 
            { _id: { $in: imagePublicIdsToDelete.filter(id => 
                mongoose.Types.ObjectId.isValid(id)
            )}}
         ).select('public_id').lean();

         const actualCloudinaryPublicIds = imageModels.map(image => image.public_id);

         if(actualCloudinaryPublicIds.length > 0){
            await imageDeletion(actualCloudinaryPublicIds);
         }else{
            console.warn(`File ${fileId} had bannerUrl ${imageIdToDelete} but no corresponding ImageModel found.`);
         }
        

          // 4. Update the File document to clear its bannerUrl
         const updatedFile = await FileModel.findOneAndUpdate(
            new mongoose.Types.ObjectId(fileId),
            { $set: { bannerUrl: null }},
            { new: true}
        ).lean();


        if(!updatedFile){
            return Response.json({
                statusCode: 500, // Internal Server Error
                message: "Failed to clear bannerUrl on the file document.",
                success: false
            }, { status: 500 });
        }

        // 5. Return success response
        return Response.json({
            statusCode: 200,
            message: "File banner deleted successfully.",
            success: true,
            data: updatedFile // Return the updated file with bannerUrl cleared
        }, { status: 200 });
        
    } catch (error: any) {
        console.log("Error while deleting banner for the file ",error)
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}