/**
 * RESOURCE: Workspace Logo Management
 * -----------------------------------
 * Endpoint: POST /api/workspace/update-logo
 * Role: Handles uploading and replacing the Workspace's visual identity.
 * Security: Session-based Auth + Workspace Access Verification.
 * Cloud: Integrates with Cloudinary for asset storage and automated cleanup.
 */

import dbConnect from "@/lib/dbConnect";
import { resourceDeletion } from "@/lib/cloudinary-utils/resourceDeletion";
import { 
    deleteFromCloudinary,
     uploadToCloudinary 
} from "@/lib/cloudinary-utils/upload-and-delete-from-cloudinary";
import ImageModel from "@/model/image.model";
import {WorkSpaceModel} from "@/model/index";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { hasWorkspaceAccess } from "@/helpers/hasWorkspaceAccess";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";

/**
 * UPDATE WORKSPACE LOGO (POST)
 * ----------------------------
 * Logic:
 * 1. Authorization: Verifies the requester has permission to modify the Workspace.
 * 2. Old Asset Cleanup: If a logo already exists, it is identified and purged from Cloudinary.
 * 3. Cloud Upload: Streams the new file to Cloudinary and retrieves the 'public_id'.
 * 4. DB Sync: Creates a new entry in 'ImageModel' to track the asset metadata.
 * 5. Update: Links the new Image document ID to the Workspace's 'logo' field.
 * 6. Rollback Mechanism: Implements a "Try-Catch-Rollback" pattern. If the database update 
 * fails after a cloud upload, the orphaned Cloudinary file is deleted to prevent storage leaks.
 */

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }
     // Variables to hold IDs for potential rollback in case of errors
    let uploadedNewLogoPublicId: string | null = null;
    let savedNewLogoImageId: mongoose.Types.ObjectId | null = null;
    try {
        const formData = await request.formData()
        const _id = formData.get("_id") as string
        const newLogo = formData.get("newLogo") as File
        // 1. Validate Workspace ID
        if(!_id || !mongoose.Types.ObjectId.isValid(_id)){
            return errorResponse(
                "Bad Request: Valid Workspace ID is required.",
                401,
                401,
            );
        }

        const workspaceId = new mongoose.Types.ObjectId(_id)
         // 2. Validate New Logo File
        if (!newLogo || newLogo.size === 0) {
            return errorResponse(
                "Bad Request: A new logo image file is required.",
                400,
                400,
            );
        }

         // 3. Find the Workspace to get the old logo's ID
         const workspace = await WorkSpaceModel.findById(workspaceId).lean();

          if (!workspace) {
            return errorResponse(
                 "Workspace not found in the database.",
                 404,
                 404,
            );
        }

        const userId = session.user._id;

        const hasAccess = hasWorkspaceAccess(workspace, userId);

        if(!hasAccess){
            return errorResponse(
                "Unauthorized",
                401,
                401,
            )
        }
         // 4. Delete Old Logo (if one exists)
         const oldLogoImageModelId = workspace?.logo as mongoose.Types.ObjectId;

         if(oldLogoImageModelId && mongoose.Types.ObjectId.isValid(oldLogoImageModelId)){
             const publicIdsToDelete = await ImageModel.find({ _id: oldLogoImageModelId }).select('public_id').lean();
            if (publicIdsToDelete.length > 0 && publicIdsToDelete[0].public_id) {
                await resourceDeletion([publicIdsToDelete[0].public_id]);
            } else {
                // Log a warning if an old logo ID exists but no corresponding ImageModel public_id was found
                console.warn(`Workspace ${workspaceId} had old logo ID ${oldLogoImageModelId}, but no corresponding ImageModel public_id found for deletion.`);
            }
         }

          // 5. Upload New Logo to Cloudinary
          const uploadLogoResult = await uploadToCloudinary(newLogo, "studysprout")  as { secure_url: string ,public_id: string }
            if(!uploadLogoResult){
                    return errorResponse(
                        "Failed to upload new logo to cloud storage.",
                        500,
                        500,
                    );
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
                        await deleteFromCloudinary(uploadedNewLogoPublicId); // Use direct Cloudinary delete for this specific rollback step
                    }
                    return errorResponse(
                        "Failed to save new logo information in the database.",
                        500,
                        500,
                    );
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
                await deleteFromCloudinary(uploadedNewLogoPublicId);
            }
            if (savedNewLogoImageId) {
                await ImageModel.findByIdAndDelete(savedNewLogoImageId);
            }
            return errorResponse(
                "Failed to update the workspace document with the new logo.",
                500,
                500,
            );
        }


        // 8. Return Success Response
        return successResponse(
            "Successfully updated the workspace logo.",
            updatedWorkspace,
            200,
            200,
        )

    } catch (error: any) {
        console.error("Error while updating the workspace logo:", error);

        // --- Comprehensive Rollback in Catch Block ---
        // Attempt to clean up Cloudinary and ImageModel entries if an error occurred after they were created.
        if (uploadedNewLogoPublicId) {
            await deleteFromCloudinary(uploadedNewLogoPublicId).catch(err =>
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
            return errorResponse(
                `Validation Error: ${messages.join(', ')}`,
                400,
                400,
            );
        }
        // Handle CastError if an invalid ObjectId was somehow processed (though initial check helps)
        if (error.name === 'CastError') {
             return errorResponse(
                "Bad Request: Invalid ID format provided.",
                400,
                400,
             );
        }

        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        );
    }

}
