/**
 * FILE BANNER API
 * ---------------
 * Role: Manage Upload, Update, and Deletion of banners for File resources.
 * Features: Automatic old-asset cleanup and transactional rollback safety.
 */
import dbConnect from "@/lib/dbConnect";
import { FileModel } from "@/model/index";
import ImageModel from "@/model/image.model";
import mongoose from "mongoose";
import { resourceDeletion } from "@/lib/cloudinary-utils/resourceDeletion";
import { uploadToCloudinary } from "@/lib/cloudinary-utils/upload-and-delete-from-cloudinary";

export async function POST(request: Request) {
    await dbConnect()
     let uploadedNewBannerPublicId: string | null = null; // Tracked for rollback
    let savedNewBannerImageId: mongoose.Types.ObjectId | null = null; // Tracked for rollback
    try {
        const formData = await request.formData()
        const _id = formData.get("id") as string
        const newBanner = formData.get("banner") as File

       // 1. Validate incoming File ID and existence
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
           return Response.json({
                statusCode: 400,
                message: "Bad Request: Valid 'id' (File ID) is required.",
                success: false
            }, { status: 400 });
        }
        const fileId = new mongoose.Types.ObjectId(_id)
        const file = await FileModel.findById(fileId)
        if(!file){
            return Response.json({
                statusCode: 404,
                message: "File is not present in server",
                success: false
            }, { status: 404 })
        }

        // 2. Cleanup old assets if they exist
        const oldBannerId = file.bannerUrl
        // if banner is already present in the file, delete the banner from cloudinary, 
        // and delete the banner from Image collection and remove it from the file
       if(oldBannerId){
            //Find public_id from Image Collection to perform Cloudinary deletion 
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
                console.warn(`File ${fileId} had old banner ID ${oldBannerId} but no corresponding ImageModel found for deletion.`);
            }
       }

       // 3. Upload New asset to Cloudinary
        if (!newBanner || newBanner.size === 0) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: A new banner image is required.",
                success: false
            }, { status: 400 });
        }
        // uploading new banner to cloudinary
        const bannerImageUploadResult  = await uploadToCloudinary(newBanner, "studysprout") as { secure_url: string, public_id: string}

        if(!bannerImageUploadResult ){
            return Response.json({
                statusCode: 500,
                message: "Failed to upload new banner image to cloud storage.",
                success: false
            }, { status: 500 });
        }
        uploadedNewBannerPublicId = bannerImageUploadResult.public_id;
        //4. Create Image record in MongoDB
        const savedBannerImage = await ImageModel.create({
            image_url: bannerImageUploadResult?.secure_url,
            public_id: bannerImageUploadResult?.public_id
        })
        savedNewBannerImageId = savedBannerImage._id as mongoose.Types.ObjectId;; 

        // failed to upload image in database then delete the image from cloudinary
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

         // 5. Link the new Banner Image to the File document
        //  Note: Using $set to update the field reference
         const updatedFile = await FileModel.findByIdAndUpdate(
            fileId,
            { $set: { $bannerUrl: savedNewBannerImageId?.toString() } },
            { new: true }
         ).lean();

        //  6. Final check and manual rollback if update failed
         if(!updatedFile){
            if(uploadedNewBannerPublicId){
                await resourceDeletion([uploadedNewBannerPublicId])
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


// Delete file banner
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
            await resourceDeletion(actualCloudinaryPublicIds);
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
        console.error("Error while deleting banner for the file ",error)
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}