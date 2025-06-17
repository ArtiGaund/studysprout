import dbConnect from "@/lib/dbConnect";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "@/lib/image-handler/upload-and-delete-image-cloudinary";
import ImageModel from "@/model/image.model";
import {WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";


export async function POST(request: Request) {
    await dbConnect()
     // Variables to hold IDs for potential rollback in case of errors
    let uploadedNewLogoPublicId: string | null = null;
    let savedNewLogoImageId: mongoose.Types.ObjectId | null = null;
    try {
        const formData = await request.formData()
        const _id = formData.get("_id") as string
        const newLogo = formData.get("newLogo") as File
        // 1. Validate Workspace ID
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
            return Response.json({
                statusCode: 401,
                message: "Bad Request: Valid Workspace ID is required.",
                success: false
            }, { status: 401 })
        }

        const workspaceId = new mongoose.Types.ObjectId(_id)
         // 2. Validate New Logo File
        if (!newLogo || newLogo.size === 0) {
            return Response.json({
                statusCode: 400,
                message: "Bad Request: A new logo image file is required.",
                success: false
            }, { status: 400 });
        }

         // 3. Find the Workspace to get the old logo's ID
         const workspace = await WorkSpaceModel.findById(workspaceId).lean();

          if (!workspace) {
            return Response.json({
                statusCode: 404, // Not Found
                message: "Workspace not found in the database.",
                success: false
            }, { status: 404 });
        }
         // 4. Delete Old Logo (if one exists)
         const oldLogoImageModelId = workspace?.logo as mongoose.Types.ObjectId;

         if(oldLogoImageModelId && mongoose.Types.ObjectId.isValid(oldLogoImageModelId)){
             const publicIdsToDelete = await ImageModel.find({ _id: oldLogoImageModelId }).select('public_id').lean();
            if (publicIdsToDelete.length > 0 && publicIdsToDelete[0].public_id) {
                await imageDeletion([publicIdsToDelete[0].public_id]);
            } else {
                // Log a warning if an old logo ID exists but no corresponding ImageModel public_id was found
                console.warn(`Workspace ${workspaceId} had old logo ID ${oldLogoImageModelId}, but no corresponding ImageModel public_id found for deletion.`);
            }
         }

          // 5. Upload New Logo to Cloudinary
          const uploadLogoResult = await uploadImageToCloudinary(newLogo, "studysprout")  as { secure_url: string ,public_id: string }
            if(!uploadLogoResult){
                    return Response.json({
                    statusCode: 500,
                    message: "Failed to upload new logo to cloud storage.",
                    success: false
                }, { status: 500 });
            }
            uploadedNewLogoPublicId = uploadLogoResult.public_id;

            // 6. Save New Logo Information in ImageModel
            const savedImage = await ImageModel.create({
                image_url: uploadLogoResult.secure_url,
                public_id: uploadLogoResult.public_id
            });
            savedNewLogoImageId = savedImage._id as mongoose.Types.ObjectId;


             if (!savedImage) {
                    // Rollback Cloudinary upload if saving to DB fails
                    if (uploadedNewLogoPublicId) {
                        await deleteImageFromCloudinary(uploadedNewLogoPublicId); // Use direct Cloudinary delete for this specific rollback step
                    }
                    return Response.json({
                        statusCode: 500,
                        message: "Failed to save new logo information in the database.",
                        success: false
                    }, { status: 500 });
                }
             // 7. Update the Workspace document with the new logo's ImageModel _id
        const updatedWorkspace  = await WorkSpaceModel.findByIdAndUpdate(
            workspaceId,
            { logo: savedImage._id }, 
            { new: true, runValidators: true }
        ).lean()

        if(!updatedWorkspace){
            // Comprehensive rollback if updating the workspace document fails
            if (uploadedNewLogoPublicId) {
                await deleteImageFromCloudinary(uploadedNewLogoPublicId);
            }
            if (savedNewLogoImageId) {
                await ImageModel.findByIdAndDelete(savedNewLogoImageId);
            }
            return Response.json({
                statusCode: 500,
                message: "Failed to update the workspace document with the new logo.",
                success: false
            }, { status: 500 });
        }


        // 8. Return Success Response
        return Response.json({
            statusCode: 200,
            message: "Successfully updated the workspace logo.",
            success: true,
            data: updatedWorkspace 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error while updating the workspace logo:", error);

        // --- Comprehensive Rollback in Catch Block ---
        // Attempt to clean up Cloudinary and ImageModel entries if an error occurred after they were created.
        if (uploadedNewLogoPublicId) {
            await deleteImageFromCloudinary(uploadedNewLogoPublicId).catch(err =>
                console.error("Rollback error: Could not delete new logo from Cloudinary:", err)
            );
        }
        if (savedNewLogoImageId) {
            await ImageModel.findByIdAndDelete(savedNewLogoImageId).catch(err =>
                console.error("Rollback error: Could not delete new logo from ImageModel:", err)
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