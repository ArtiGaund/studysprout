import dbConnect from "@/lib/dbConnect";
// import { deleteImageFromCloud, uploadImage } from "@/lib/upload-image";
import {FileModel,FolderModel, WorkSpaceModel} from "@/model/index";

import ImageModel from "@/model/image.model";
import mongoose from "mongoose";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/image-handler/upload-and-delete-image-cloudinary";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";

export async function POST(request: Request) {
    await dbConnect()
     let uploadedNewBannerPublicId: string | null = null; // For potential rollback
    let savedNewBannerImageId: mongoose.Types.ObjectId | null = null; // For potential rollback
    try {
        const formData = await request.formData()
        const _id = formData.get("id") as string
        const newBanner = formData.get("banner") as File

       // 1. Validate File ID
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
           return Response.json({
                statusCode: 400,
                message: "Bad Request: Valid 'id' (File ID) is required.",
                success: false
            }, { status: 400 });
        }

        // search of file using id
        const fileId = new mongoose.Types.ObjectId(_id)

         // 2. Find the File
        const file = await FileModel.findById(fileId)

        // if file is not present in server
        if(!file){
            return Response.json({
                statusCode: 404,
                message: "File is not present in server",
                success: false
            }, { status: 404 })
        }

        // 3. Delete Old Banner (if exists)
        const oldBannerId = file.bannerUrl
        // if banner is already present in the file, delete the banner from cloudinary, 
        // and delete the banner from Image collection and remove it from the file
       if(oldBannerId){
            const publicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [oldBannerId];
            const imageModels = await ImageModel.find(
                { _id: { $in: publicIdsToDelete.filter(id =>
                    mongoose.Types.ObjectId.isValid(id)
                )}}
            ).select('public_id').lean();
            const actualCloudinaryPublicIds = imageModels.map(img => img.public_id);
            if(actualCloudinaryPublicIds.length > 0){
                await imageDeletion(actualCloudinaryPublicIds);
            }else{
                console.warn(`File ${fileId} had old banner ID ${oldBannerId} but no corresponding ImageModel found for deletion.`);
            }
       }

       // 4. Upload New Banner to Cloudinary
        if (!newBanner || newBanner.size === 0) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: A new banner image is required.",
                success: false
            }, { status: 400 });
        }
        // uploading new banner to cloudinary
        const bannerImageUploadResult  = await uploadImageToCloudinary(newBanner, "studysprout") as { secure_url: string, public_id: string}

        if(!bannerImageUploadResult ){
            return Response.json({
                statusCode: 500,
                message: "Failed to upload new banner image to cloud storage.",
                success: false
            }, { status: 500 });
        }
        uploadedNewBannerPublicId = bannerImageUploadResult.public_id;
        // 5. Save New Banner Image in ImageModel
        const savedBannerImage = await ImageModel.create({
            image_url: bannerImageUploadResult?.secure_url,
            public_id: bannerImageUploadResult?.public_id
        })
        savedNewBannerImageId = savedBannerImage._id as mongoose.Types.ObjectId;; 

        // failed to upload image in database then delete the image from cloudinary
        if(!savedBannerImage){
            if (uploadedNewBannerPublicId) {
                await imageDeletion([uploadedNewBannerPublicId]); // Use utility for rollback
            }
           return Response.json({
                statusCode: 500,
                message: "Failed to save new banner image in database.",
                success: false
            }, { status: 500 });
        }

         // 6. Update the File document's bannerUrl
         const updatedFile = await FileModel.findByIdAndUpdate(
            fileId,
            { $set: { $bannerUrl: savedNewBannerImageId?.toString() } },
            { new: true }
         ).lean();

         if(!updatedFile){
            if(uploadedNewBannerPublicId){
                await imageDeletion([uploadedNewBannerPublicId])
            }
            if(savedNewBannerImageId){
                await ImageModel.findByIdAndDelete(savedNewBannerImageId)
            }
            return Response.json({
                statusCode: 500,
                message: "Failed to update banner URL on the file document.",
                success: false
            }, { status: 500 });
         }

         // 7. Return Success Response
        return Response.json({
            statusCode: 200,
            message: "Successfully uploaded new banner for the file.",
            success: true,
            data: updatedFile // Return the updated file
        }, { status: 200 });

        
    } catch (error: any) {
        console.error("Error while uploading the banner for file:", error);
        // --- Manual Rollback in case of an error during creation/update steps ---
        if (uploadedNewBannerPublicId) {
            await imageDeletion([uploadedNewBannerPublicId]).catch(err => console.error("Rollback error deleting new banner from cloud:", err));
        }
        if (savedNewBannerImageId) {
            await ImageModel.findByIdAndDelete(savedNewBannerImageId).catch(err => console.error("Rollback error deleting new banner from DB:", err));
        }
        // --- End of Manual Rollback ---

        // Handle specific error types if needed (e.g., Mongoose validation errors)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return Response.json({
                statusCode: 400,
                message: `Validation Error: ${messages.join(', ')}`,
                success: false
            }, { status: 400 });
        }

        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}