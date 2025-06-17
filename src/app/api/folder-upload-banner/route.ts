import dbConnect from "@/lib/dbConnect";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/image-handler/upload-and-delete-image-cloudinary";
import {FolderModel, WorkSpaceModel} from "@/model/index";
import ImageModel from "@/model/image.model";

import mongoose from "mongoose";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";

export async function POST(request: Request) {
    await dbConnect()
     let uploadedNewBannerPublicId: string | null = null; // For potential rollback
    let savedNewBannerImageId: mongoose.Types.ObjectId | null = null; // For potential rollback
    try {
        const formData = await request.formData()
        const _id = formData.get("id") as string
        const newBanner = formData.get("banner") as File

       // 1. Validate Folder id 
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
            return Response.json({
                statusCode: 401,
                message: "Bad Request: Valid 'id' (Folder ID) is required.",
                success: false
            }, { status: 400 })
        }

        // search of file using id
        const folderId = new mongoose.Types.ObjectId(_id)

         // 2. Find the Folder
        const folder = await FolderModel.findById(folderId)

        // if folder is not present in server
        if(!folder){
            return Response.json({
                statusCode: 404,
                message: "folder is not present in server",
                success: false
            }, { status: 404 })
        }
         // 3. Delete Old Banner (if exists)
        const oldBannerId = folder.bannerUrl
        // if banner is already present in the folder, delete the banner from cloudinary, 
        // and delete the banner from Image collection and remove it from the folder
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
                        console.warn(`Folder ${folderId} had old banner ID ${oldBannerId} but no corresponding ImageModel found for deletion.`);
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
        const bannerImageUploadResult = await uploadImageToCloudinary(newBanner, "studysprout") as { secure_url: string, public_id: string}

        if(!bannerImageUploadResult){
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
                const updatedFolder = await FolderModel.findByIdAndUpdate(
                    folderId,
                    { $set: { $bannerUrl: savedNewBannerImageId?.toString() } },
                    { new: true }
                ).lean();
                 if(!updatedFolder){
                            if(uploadedNewBannerPublicId){
                                await imageDeletion([uploadedNewBannerPublicId])
                            }
                            if(savedNewBannerImageId){
                                await ImageModel.findByIdAndDelete(savedNewBannerImageId)
                            }
                            return Response.json({
                                statusCode: 500,
                                message: "Failed to update banner URL on the folder document.",
                                success: false
                            }, { status: 500 });
                         }
                         // 7. Return Success Response
                    return Response.json({
                        statusCode: 200,
                        message: "Successfully uploaded new banner for the folder.",
                        success: true,
                        data: updatedFolder // Return the updated file
                    }, { status: 200 });
                            
    } catch (error: any) {
        console.error("Error while uploading the banner for folder:", error);
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