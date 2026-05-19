/**
 * FOLDER BANNER API
 * -----------------
 * Role: Manages Upload, Update, and Deletion of banners for Folder resources.
 * Features: Automatic old-asset cleanup and transactional rollback safety.
 */

import dbConnect from "@/lib/dbConnect";
import {FolderModel} from "@/model/index";
import ImageModel from "@/model/image.model";
import mongoose from "mongoose";
import { resourceDeletion } from "@/lib/cloudinary-utils/resourceDeletion";
import {  uploadToCloudinary } from "@/lib/cloudinary-utils/upload-and-delete-from-cloudinary";

export async function POST(request: Request) {
    await dbConnect()
     let uploadedNewBannerPublicId: string | null = null; // Track for rollback
    let savedNewBannerImageId: mongoose.Types.ObjectId | null = null; // Track for rollback
    try {
        const formData = await request.formData()
        const _id = formData.get("id") as string
        const newBanner = formData.get("banner") as File

       // 1. Validate incoming Folder ID and existence
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
            return Response.json({
                statusCode: 401,
                message: "Bad Request: Valid 'id' (Folder ID) is required.",
                success: false
            }, { status: 400 })
        }
        const folderId = new mongoose.Types.ObjectId(_id)
        const folder = await FolderModel.findById(folderId)
        if(!folder){
            return Response.json({
                statusCode: 404,
                message: "folder is not present in server",
                success: false
            }, { status: 404 })
        }
        
         // 2. Cleanup old assests if they exist
        const oldBannerId = folder.bannerUrl
        // if banner is already present in the folder, delete the banner from cloudinary, 
        // and delete the banner from Image collection and remove it from the folder
        if(oldBannerId){
            // Find public_id from Image Collection to perform Cloudinary deletion
            const publicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [oldBannerId];
                const imageModels = await ImageModel.find(
                    { _id: { $in: publicIdsToDelete.filter(id =>
                        mongoose.Types.ObjectId.isValid(id)
                    )}}
                    ).select('public_id').lean();
                    const actualCloudinaryPublicIds = imageModels.map(img => img.public_id);
                    if(actualCloudinaryPublicIds.length > 0){
                        await resourceDeletion(actualCloudinaryPublicIds);
                    }else{
                        console.warn(`Folder ${folderId} had old banner ID ${oldBannerId} but no corresponding ImageModel found for deletion.`);
                    }
        }

        // 3. Upload new asset to Cloudinary
        if (!newBanner || newBanner.size === 0) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: A new banner image is required.",
                success: false
            }, { status: 400 });
        }
    
        const bannerImageUploadResult = await uploadToCloudinary(newBanner, "studysprout") as { secure_url: string, public_id: string}

        if(!bannerImageUploadResult){
             return Response.json({
                statusCode: 500,
                message: "Failed to upload new banner image to cloud storage.",
                success: false
            }, { status: 500 });
        }

        uploadedNewBannerPublicId = bannerImageUploadResult.public_id;
                
        // 4. Create Image record in MongoDB
        const savedBannerImage = await ImageModel.create({
            image_url: bannerImageUploadResult?.secure_url,
                public_id: bannerImageUploadResult?.public_id
             })
             savedNewBannerImageId = savedBannerImage._id as mongoose.Types.ObjectId;; 
        
            if(!savedBannerImage){
              if (uploadedNewBannerPublicId) {
                    await resourceDeletion([uploadedNewBannerPublicId]); // Use utility for rollback
               }
               return Response.json({
                statusCode: 500,
                message: "Failed to save new banner image in database.",
                success: false
                }, { status: 500 });
            }
        
            //5. Link the new Banner Image to the Folder Document
            // Note: Using $set to update the field reference
            const updatedFolder = await FolderModel.findByIdAndUpdate(
                folderId,
                { $set: { $bannerUrl: savedNewBannerImageId?.toString() } },
                { new: true }
            ).lean();

             // 6.Final check and manual rollback if update failed
             if(!updatedFolder){
                if(uploadedNewBannerPublicId){
                    await resourceDeletion([uploadedNewBannerPublicId])
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
               await resourceDeletion([uploadedNewBannerPublicId]).catch(err => console.error("Rollback error deleting new banner from cloud:", err));
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

// Delete folder banner

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
            await resourceDeletion(actualCloudinaryPublicIds);
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