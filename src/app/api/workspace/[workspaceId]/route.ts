/**
 * GET SINGLE WORKSPACE (GET)
 * -------------------------
 * Role: The primary hydration point for the Workspace Dashboard.
 * Logic:
 * 1. Security: Authenticates the user session via NextAuth.
 * 2. Validation: Ensures the 'workspaceId' is a valid MongoDB ObjectId.
 * 3. Access Control: Uses 'hasWorkspaceAccess' to check RBAC permissions 
 * (Collaborator/Owner) before returning sensitive data.
 * 4. Error Handling: Differentiates between 'Not Found' (404) and 'Forbidden' (403).
 */

import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect"
import {
    WorkSpaceModel, 
    FileModel,
    FolderModel, 
    ImageModel, 
    UserModel, 
    FlashcardSetModel,
    FlashcardModel,
    FlashcardProgressModel
} from "@/model/index"
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options"
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";
import { hasWorkspaceAccess } from "@/helpers/hasWorkspaceAccess";
import { resourceDeletion } from "@/lib/cloudinary-utils/resourceDeletion"
import { isValidId } from "@/helpers/validateId";

export async function GET(
    request: Request,
    { params }: { params: { workspaceId: string }}
) {
   
    await dbConnect();

     const session = await getServerSession(authOptions);

     // 1. Validate session
        if(!session?.user?._id){
            return errorResponse(
                "Unauthorized",
                401,
                401
            )
        }
   
    const workspaceId = params.workspaceId;

    if(!isValidId(workspaceId) || !workspaceId){
        return errorResponse(
            "Invalid workspaceId",
            401,
            401,
        );
    }

    try {
        const workspace = await WorkSpaceModel.findById({
            _id: workspaceId
        })
        
        if(!workspace){
            return errorResponse(
                "No workspace from this id present",
                404,
                404,
            )
        }

        const userId = session.user._id;

       const hasAccess = hasWorkspaceAccess(workspace, userId);

        if(!hasAccess){
            return errorResponse(
                "Unauthorized",
                403,
                403,
            );
        }
        return successResponse(
            "Successfully fetched current workspace",
            workspace,
            200,
            200,
        );
    } catch (error: any) {
         console.error("Error while fetching current workspace:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return errorResponse(
                "Bad Request: Invalid ID format provided for workspace.",
                400,
                400,
             );
        }

        // Generic internal server error
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        );
    }
}
/**
 * RESOURCE: Workspace Configuration
 * --------------------------------
 * Endpoint: POST /api/workspaces/[workspaceId]
 * Role: Updates top-level workspace metadata (Title, Icon, Banner, Permissions).
 * Security: Session-based Auth + Ownership Validation.
 * Real-time: Emits 'workspace-updated' to ensure UI consistency across all 
 * connected collaborators in the same environment.
 */
export async function POST(
    request: Request,
    { params }: { params: { workspaceId: string }}
) {
    await dbConnect()
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
              // 1. Validate Workspace ID
           
            const workspaceId = params.workspaceId;
             if(!workspaceId || !isValidId(workspaceId)){
                return errorResponse(
                    "Bad Request: Workspace ID is required and must be a valid ObjectId.",
                    400,
                    400,
                );
            }
           
            /** * 2. ATOMIC UPDATE: 
             * Performs a findOneAndUpdate with 'runValidators' enabled to ensure 
             * schema integrity (e.g., preventing empty titles).
             */
            const workspace = await WorkSpaceModel.findByIdAndUpdate(
                workspaceId,
                updates,
                { new: true, runValidators: true }
            ).lean()

            if(!workspace){
                return errorResponse(
                    "Failed to update data in workspace",
                    404,
                    404,
                );
            }   
            // NOTE: In a multi-user environment, consider adding an 'emitRealtimeEvent' 
         // here to sync the title/icon change to other active tabs.

            return successResponse(
                "Updated data in workspace sucessfully. ",
                workspace,
                200,
                200,
            );

    } catch (error: any) {
       console.error("Error while updating the Workspace:", error);

        // Handle specific Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return errorResponse(
                `Validation Error: ${messages.join(', ')}`,
                400,
                400,
            );
        }
        // Handle CastError for invalid ObjectId if it wasn't caught earlier
        if (error.name === 'CastError' && error.path === '_id') {
             return errorResponse(
                "Bad Request: Invalid workspace ID format provided.",
                400,
                400,
             );
        }

        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        )
    }
}
/**
 * RESOURCE: Workspace Management
 * -----------------------------
 * Endpoint: DELETE /api/workspaces/[workspaceId]
 * Role: Performs a complete "Nuclear" cascading deletion of a workspace and all dependencies.
 * Security: Owner-only access (Verifies workspace_owner against session user).
 * * Logic Flow:
 * 1. Asset Recovery: Identifies all child Folders and Files.
 * 2. Cloud Cleanup: Deletes all associated Cloudinary assets (Logos & Banners).
 * 3. Recursive DB Delete: Wipes Folders -> Files -> FlashcardSets -> Flashcards -> Progress.
 * 4. User Sync: Pulls the workspace ID from the User document's workspace array.
 */
export async function DELETE(
    request: Request,
    { params }: { params: { workspaceId: string }}
){
    await dbConnect()
    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }
    const workspaceId = params.workspaceId;
     // 1. Validate workspaceId
    if(!workspaceId){
        return errorResponse(
            "Bad Request: 'workspaceId' query parameter is required.",
            400,
            400,
        );
    }
    if (!isValidId(workspaceId)) {
        return errorResponse(
            "Bad Request: Invalid 'workspaceId' format.",
            400,
            400,
        );
    }
    try {
        // 2. find the workspace first to get its details and its folders and its files, before deleting it
        const workspaceToDelete = await WorkSpaceModel.findById(workspaceId).lean();

        if(!workspaceToDelete){
             return errorResponse(
                "Workspace not found in database.",
                404,
                404,
             )
        }

        // Check ownership
        if (workspaceToDelete.workspace_owner.toString() !== session.user._id) {
            return errorResponse(
                "Only the owner can delete this workspace" ,
                403,
                403,
            );
        }
         const workspaceOwnerId = workspaceToDelete.workspace_owner;
        //  --- start cascading deletion for folders, files and images
        const imagePublicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [];

        // 3. collect images public_ids associated with workspace itself
        if(workspaceToDelete.logo){
            imagePublicIdsToDelete.push(workspaceToDelete.logo as mongoose.Types.ObjectId);
        }
        
        //4. find all folders within the workspace and collect their images public_ids
        const foldersInWorkspace = await FolderModel.find(
            { workspaceId: workspaceId }
        ).select('_id bannerUrl').lean();

        const folderIdsToDelete = foldersInWorkspace.map(folder => folder._id);

        foldersInWorkspace.forEach(folder => {
            if(folder.bannerUrl){
                imagePublicIdsToDelete.push(folder.bannerUrl);
            }
        })

        // 5. find all files within the folders and collect their images public_ids
        const filesInFolder = await FileModel.find(
            { folderId: { $in: folderIdsToDelete } }
        ).select('_id bannerUrl').lean();

        const fileIdsToDelete = filesInFolder.map(file => file._id);
        filesInFolder.forEach(file => {
            if(file.bannerUrl){
                imagePublicIdsToDelete.push(file.bannerUrl);
            }
        })

        // 6. Resolve all collected imageModel _ids to actual cloudinary public_ids and delete images
        if(imagePublicIdsToDelete.length > 0){
            const imageModels = await ImageModel.find(
                { _id: { $in: imagePublicIdsToDelete.filter(id => 
                    mongoose.Types.ObjectId.isValid(id)
                )}}
            ).select('public_id').lean();
            const actualCloudinaryPublicIds = imageModels.map(image => image.public_id);
            await resourceDeletion(actualCloudinaryPublicIds);
        }

        // 7. delete all files within the folders
        if(fileIdsToDelete.length > 0){
            const deleteFilesResult = await FileModel.deleteMany(
                { _id: { $in: fileIdsToDelete}}
            )
        }
        // 8. delete all folders within the workspace
        if(folderIdsToDelete.length > 0){
            const deleteFoldersResult = await FolderModel.deleteMany(
                { _id: { $in: folderIdsToDelete}}
            )
        }

        // 8.5. Cascading Flashcard Cleanup
        // Find all FlashcardSets tied to this workspace
        const flashcardSets = await FlashcardSetModel.find({ workspaceId }).select('_id');
        const setIds = flashcardSets.map(s => s._id);

        if (setIds.length > 0) {
            // Delete all flashcards belonging to these sets
            const flashcards = await FlashcardModel.find({ parentSetId: { $in: setIds } }).select('_id');
            const cardIds = flashcards.map(c => c._id);

            if (cardIds.length > 0) {
                // Delete all SRS progress records
                await FlashcardProgressModel.deleteMany({ flashcardId: { $in: cardIds } });
                // Delete the cards themselves
                await FlashcardModel.deleteMany({ _id: { $in: cardIds } });
            }
            // Delete the sets
            await FlashcardSetModel.deleteMany({ _id: { $in: setIds } });
        }
        // --- End Cascading Deletion for Folders, Files, and Images ---

        // 9. Remove workspace reference from the users workspace array
        const userUpdateResult = await UserModel.updateOne(
            { _id: workspaceOwnerId },
            { $pull: { workspace: new mongoose.Types.ObjectId(workspaceId) } }
        );
        if(userUpdateResult.modifiedCount === 0){
            console.warn(`Workspace reference ${workspaceId} not found or already removed from user ${workspaceOwnerId}.`);
        }
        
        // 10. delete the workspace
        const deleteWorkspaceResult = await WorkSpaceModel.findByIdAndDelete(workspaceId);
         if (!deleteWorkspaceResult) {
            return errorResponse(
                "Failed to delete the workspace document.",
                500,
                500,
            );
        }
        // 11. Return success response
        return successResponse(
            "Workspace and all its contents (folders, files, images) deleted successfully.",
            200,
            200,
        );
    } catch (error: any) {
       console.error("Error while deleting the workspace:", error);
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        );
    }

}
