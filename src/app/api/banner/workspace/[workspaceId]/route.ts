/**
 * WORKSPACE BANNER API
 * --------------------
 * Role: Manages Upload, Update, and Deletion of banner for Workspace resources.
 * FEATURES: Automatic old-asset cleanup and transactional rollback safety.
 */
import dbConnect from "@/lib/dbConnect";
import ImageModel from "@/model/image.model";
import {WorkSpaceModel} from "@/model/index";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";
import mongoose from "mongoose";
import { 
    deleteImageFromCloudinary, 
    uploadImageToCloudinary 
} from "@/lib/image-handler/upload-and-delete-image-cloudinary";

export async function POST(request: Request) {
    await dbConnect()

    let uploadedNewBannerPublicId: string | null = null; //Track for rollback
    let savedNewBannerImageId: mongoose.Types.ObjectId | null = null; //Track for rollback
    try {
        const formData = await request.formData()
        const _id = formData.get("id") as string
        const newBanner = formData.get("banner") as File

         // 1. Validate incoming Workspace ID and existence
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
            return Response.json({
                statusCode: 401,
                message:"Bad Request: Valid Workspace ID is required.",
                success: false
            }, { status: 401 })
        }
        const workspaceId = new mongoose.Types.ObjectId(_id)
        if (!newBanner || newBanner.size === 0) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: A new banner image file is required.",
                success: false
            }, { status: 400 });
        }
        const workspace = await WorkSpaceModel.findById(workspaceId)
        if(!workspace){
            return Response.json({
                statusCode: 404,
                message: "workspace is not present in server",
                success: false
            }, { status: 404 })
        }
         //2. Cleanup old assets if they exist
        const oldBannerId = workspace.bannerUrl
        // if banner is already present in the workspace, delete the banner from cloudinary, 
        // and delete the banner from Image collection and remove it from the workspace
        if(oldBannerId && mongoose.Types.ObjectId.isValid(oldBannerId)){
            // Find public_id from Image collection to perform Cloudinary deletion
            const publicIdsToDelete = await ImageModel.find({ _id: oldBannerId }).select('public_id').lean();
            if (publicIdsToDelete.length > 0 && publicIdsToDelete[0].public_id) {
                await imageDeletion([publicIdsToDelete[0].public_id]);
            } else {
             // Log a warning if an old logo ID exists but no corresponding ImageModel public_id was found
                console.warn(`Workspace ${workspaceId} had old logo ID ${oldBannerId}, but no corresponding ImageModel public_id found for deletion.`);
            }
        }
        //3. Upload new asset to Cloudinary
        const updatedBannerResult = await uploadImageToCloudinary(newBanner, "studysprout") as { secure_url: string, public_id: string}

        if(!updatedBannerResult){
            return Response.json({
                statusCode: 405,
                message: "Failed to upload new banner on cloudinary",
                success: false
            } , { status: 500 })
        }
        uploadedNewBannerPublicId = updatedBannerResult.public_id;

        //4. Create Image record in MongoDB 
        const savedBannerImage = await ImageModel.create({
            image_url: updatedBannerResult?.secure_url,
            public_id: updatedBannerResult?.public_id
        })
        savedNewBannerImageId = savedBannerImage?._id  as mongoose.Types.ObjectId;
        // failed to upload image in database then delete the image from cloudinary
        if(!savedBannerImage){
            // Rollback Cloudinary upload if saving to DB fails
            if (uploadedNewBannerPublicId) {
                await deleteImageFromCloudinary(uploadedNewBannerPublicId); // Use direct Cloudinary delete for this specific rollback step
            }
            return Response.json({
                statusCode: 500,
                message: "Failed to save new banner information in the database.",
                success: false
            }, { status: 500 });
        }

        // 5. Link the new Banner image to the Workspace document
        // Note: Using $set to update the field reference
        const updatedWorkspace  = await WorkSpaceModel.findByIdAndUpdate(
            workspaceId,
           { logo: savedBannerImage._id }, 
           { new: true, runValidators: true }
        ).lean()

        //6. Final check and manual rollback if update failed    
        if(!updatedWorkspace){
            // Comprehensive rollback if updating the workspace document fails
            if (uploadedNewBannerPublicId) {
                await deleteImageFromCloudinary(uploadedNewBannerPublicId);
            }
            if (savedNewBannerImageId) {
                await ImageModel.findByIdAndDelete(savedNewBannerImageId);
            }
            return Response.json({
                statusCode: 500,
                message: "Failed to update the workspace document with the new banner.",
                success: false
            }, { status: 500 });
        }
        

       // 8. Return Success Response
        return Response.json({
            statusCode: 200,
            message: "Successfully updated the workspace banner.",
            success: true,
            data: updatedWorkspace 
        }, { status: 200 });
    } catch (error: any) {
       console.error("Error while updating the workspace banner:", error);
       
        // --- Comprehensive Rollback in Catch Block ---
        // Attempt to clean up Cloudinary and ImageModel entries if an error occurred after they were created.
        if (uploadedNewBannerPublicId) {
           await deleteImageFromCloudinary(uploadedNewBannerPublicId).catch(err =>
               console.error("Rollback error: Could not delete new banner from Cloudinary:", err)
           );
        }
        if (savedNewBannerImageId) {
           await ImageModel.findByIdAndDelete(savedNewBannerImageId).catch(err =>
             console.error("Rollback error: Could not delete new banner from ImageModel:", err)
           );
        }
        // --- End of Rollback ---
       
        // Handle specific Mongoose validation errors
        if (error.name === 'ValidationError') {
           const messages = Object.values(error.errors).map((err: any) => err.message);
           return Response.json({
                statusCode: 400,
                message: `Validation Error: ${messages.join(', ')}`,
                success: false
           }, { status: 400 });
        }
        // Handle CastError if an invalid ObjectId was somehow processed (though initial check helps)
        if (error.name === 'CastError') {
            return Response.json({
               statusCode: 400,
               message: "Bad Request: Invalid ID format provided.",
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

// Delete workspace banner
export async function DELETE(request:Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    // 1. Validate workspaceId
    if(!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)){
        return Response.json({
            statusCode: 400,
            message:  "Bad Request: Valid 'workspaceId' query parameter is required.",
            success:false
        }, { status: 400 })
    }
    try {
       // 2. Find the workspace to get its current bannerUrl (ImageModel _id)
        const workspace = await WorkSpaceModel.findById(workspaceId).lean();

        if(!workspace){
            return Response.json({
                statusCode: 404,
                message: "workspace not found in database",
                success: false
            }, { status: 404 })
        }

        const imageToDelete = workspace.bannerUrl

         // If there's no banner image associated, just return success
        if (!imageToDelete) {
            return Response.json({
                statusCode: 200,
                message: "Workspace has no banner image to delete.",
                success: true
            }, { status: 200 });
        }

        // 3. Resolve ImageModel _id to Cloudinary public_id and delete image
        const publicIdsToProcess: (string | mongoose.Types.ObjectId)[] = [imageToDelete];
        const imageModels = await ImageModel.find({ _id: { $in: publicIdsToProcess.filter(id =>
            mongoose.Types.ObjectId.isValid(id)) } }).select('public_id').lean();
        const actualCloudinaryPublicIds = imageModels.map(img => img.public_id);
        if (actualCloudinaryPublicIds.length > 0) {
            await imageDeletion(actualCloudinaryPublicIds);
        } else {
            console.warn(`Workspace ${workspaceId} had bannerUrl ${imageToDelete} but no corresponding ImageModel found.`);
        }

        // 4. Update the Workspace document to clear its bannerUrl
        const updatedWorkspace = await WorkSpaceModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(workspaceId) },
            { $set: { bannerUrl: null } },
            { new: true }
        ).lean();

        if(!updatedWorkspace){
            return Response.json({
                statusCode: 500, // Internal Server Error
                message: "Failed to clear bannerUrl on the workspace document.", // Corrected message
                success: false
            }, { status: 500 });
        }
        

        return Response.json({
                statusCode: 200,
                message: "Successfully deleted banner for the folder.", // Added period for consistency
                success: true,
                data: updatedWorkspace
            }, { status: 200 });
    } catch (error: any) {
        console.error("Error while deleting file banner:", error); // Changed message for consistency
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}