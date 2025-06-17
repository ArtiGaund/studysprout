import dbConnect from "@/lib/dbConnect";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/image-handler/upload-and-delete-image-cloudinary";
import ImageModel from "@/model/image.model";
import {WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";

export async function POST(request: Request) {
    await dbConnect()
     // Variables to hold IDs for potential rollback in case of errors
    let uploadedNewBannerPublicId: string | null = null;
    let savedNewBannerImageId: mongoose.Types.ObjectId | null = null;
    try {
        const formData = await request.formData()
        const _id = formData.get("id") as string
        const newBanner = formData.get("banner") as File

         // 1. Validate Workspace ID
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
            return Response.json({
                statusCode: 401,
                message:"Bad Request: Valid Workspace ID is required.",
                success: false
            }, { status: 401 })
        }

        // search of file using id
        const workspaceId = new mongoose.Types.ObjectId(_id)
        // 2. Validate New Banner File
        if (!newBanner || newBanner.size === 0) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: A new banner image file is required.",
                success: false
            }, { status: 400 });
        }
        // 3. Find the Workspace to get the old banner's ID
        const workspace = await WorkSpaceModel.findById(workspaceId)

        // if folder is not present in server
        if(!workspace){
            return Response.json({
                statusCode: 404,
                message: "workspace is not present in server",
                success: false
            }, { status: 404 })
        }
         // 4. Delete Old Banner (if one exists)
        const oldBannerId = workspace.bannerUrl
        // if banner is already present in the workspace, delete the banner from cloudinary, 
        // and delete the banner from Image collection and remove it from the workspace
        if(oldBannerId && mongoose.Types.ObjectId.isValid(oldBannerId)){
            const publicIdsToDelete = await ImageModel.find({ _id: oldBannerId }).select('public_id').lean();
            if (publicIdsToDelete.length > 0 && publicIdsToDelete[0].public_id) {
                await imageDeletion([publicIdsToDelete[0].public_id]);
            } else {
             // Log a warning if an old logo ID exists but no corresponding ImageModel public_id was found
                console.warn(`Workspace ${workspaceId} had old logo ID ${oldBannerId}, but no corresponding ImageModel public_id found for deletion.`);
            }
        }
        // 5. Upload New Banner to Cloudinary
        const updatedBannerResult = await uploadImageToCloudinary(newBanner, "studysprout") as { secure_url: string, public_id: string}

        if(!updatedBannerResult){
            return Response.json({
                statusCode: 405,
                message: "Failed to upload new banner on cloudinary",
                success: false
            } , { status: 500 })
        }
        uploadedNewBannerPublicId = updatedBannerResult.public_id;

        // 6. Save New Logo Information in ImageModel
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

       // 7. Update the Workspace document with the new banner's ImageModel _id
        const updatedWorkspace  = await WorkSpaceModel.findByIdAndUpdate(
                   workspaceId,
                   { logo: savedBannerImage._id }, 
                   { new: true, runValidators: true }
               ).lean()

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