/**
 * GET SINGLE FOLDER
 * ---------------
 * Role: Fetches full details for a specific folder.
 * Logic:
 * 1. Validation: Ensures the 'folderId' from the URL is a valid MongoDB ObjectId
 * 2. Retrieval: Finds the document by ID.
 * 3. Integrity: Returns a 404 if the folder is missing or has been hard-deleted.
 */

import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect"
import {
    FolderModel,
    FileModel, 
    ImageModel, 
    WorkSpaceModel
} from "@/model/index"
import { AnyExpression } from "mongoose";
import { imageDeletion } from "@/lib/image-handler/imageDeletion"
import { isValidId } from "@/helpers/validateId";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { emitRealtimeEvent } from "@/lib/realtime-fetch";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";

export async function GET(
    request: Request,
    { params }: { params: { folderId: string }}
) {
    await dbConnect()

    const folderId = params.folderId

    if(!folderId || !isValidId(folderId)){
        return errorResponse(
            "folderId not found or invalid folder id",
            404,
            404,
        );
    }

    try {
        const folder = await FolderModel.findById({
            _id: folderId
        })
        if(!folder){
            return errorResponse(
                "No folder from this id present",
                404,
                404,
            );
        }
        return successResponse(
            "Successfully fetched current folder",
            folder,
            200,
            200,
        );
    } catch (error: AnyExpression) {
         console.error("Error while fetching current folder:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return errorResponse(
                "Bad Request: Invalid ID format provided for folder.",
                400,
                400
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
 * UPDATE FOLDER
 * -----------
 * Logic:
 * 1. Targeted Updates: Explicitly maps allowed fields (title, icon, inTrash) to prevent injection.
 * 2. State Mapping: Detects 'inTrash' changes to toggle 'folder_trashed' vs 'folder_restored' events.
 * 3. Delayed Socket: Uses a small timeout for the emission to ensure DB consistency before UI update.
 */
export async function POST(
    request: Request,
    { params }: { params: { folderId: string }}
) {
    await dbConnect()

    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return Response.json({
            statusCode: 401,
            message: "Unauthorized",
            success: false
        }, { status: 401 })
    }


    const userId = session.user._id;
    try {
        const updatedData = await request.json();
           
            const { _id, ...updates } = updatedData;
             // 1. Validate Folder ID
              const folderId = params.folderId;
            if(!folderId || !isValidId(folderId)){
                return errorResponse(
                    "Bad Request: Folder ID is required and must be a valid ObjectId.",
                    400,
                    400,
                );
            }
           let event_type = "folder_updated";
           if("inTrash" in updates){
                if(!updates.inTrash){
                event_type = "folder_restored";
            }else{
                event_type = "folder_trashed";
            }
           }else{
            event_type = "folder_updated";
           }
             // 2. Update the Folder document directly
            const folder = await FolderModel.findByIdAndUpdate(
                folderId,
                updates,
                { new: true, runValidators: true }
            ).lean();
            if(!folder){
                return errorResponse(
                    "Failed to update data in folder",
                    405,
                    405,
                );
            }   

                    const payload = {
                        workspaceId: String(folder.workspaceId),
                        folderId: String(folder._id),
                        updates: folder,
                        actorId: String(userId),
                    }
                   try {
                     await emitRealtimeEvent(
                         'workspace-tree-update',
                         String(folder.workspaceId),
                         event_type,
                         payload,
                     );
                   } catch (socketError) {
                        console.error("[Socket Emission Failed]  Folder update: ",socketError);
                   }
            
                 const data = {folder}
            return successResponse(
                "Updated data in folder sucessfully. ",
                data,
                200,
                200,
            );
    } catch (error: any) {
        console.error("Error while updating the folder:", error);

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
                "Bad Request: Invalid folder ID format provided.",
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
/**
 * PERMANENT DELETE FOLDER
 * ---------------------
 * Logic:
 * 1. Image Cleanup: Identifies and deletes associates Cloudinary banners/icons.
 * 2. Decoupling: Pulls the Folder ID from the parent WORKSPACE's array to maintain referential integrity.
 * 3. Destruction: Removes the FOLDER document from the database.
 * 4. Global Sync: Emits 'folder_deleted' to clear the item from all active users sidebars.
 * NOTE: Delete all the files of the folder, if folder is deleted
 */
export async function DELETE(
    request: Request,
    { params }: { params: { folderId: string }}
){
    await dbConnect();

    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }


    const userId = session.user._id;
    const folderId = params.folderId;
    // 1. Validate folderId
    if(!folderId){
        return errorResponse(
            "Folder id required",
            400,
            400,
        );
    }
     if (!isValidId(folderId)) {
        return errorResponse(
            "Bad Request: Invalid 'folderId' format.",
            400,
            400,
        )
    }

    try {
        // 2. find the folder first to get its details and its files, before deletion
        const folderToDelete = await FolderModel.findById(folderId).lean();

        if (!folderToDelete) {
            return errorResponse(
                "Folder not found in database.",
                404,
                404,
            );
        }

        // start cascading deletion for files and images
        const imagePublicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [];

        // 3. collect image public_ids associated with the folder itself (if any)
        if(folderToDelete.bannerUrl){
            imagePublicIdsToDelete.push(folderToDelete.bannerUrl);
        }

        // 4. find all files within this folder and collect their images public_ids 
        const filesInFolder = await FileModel.find(
            { folderId: folderId }
        ).select('_id bannerUrl').lean();
        const fileIdsToDelete = filesInFolder.map(file => file._id);

        filesInFolder.forEach(file => {
            if(file.bannerUrl){
                imagePublicIdsToDelete.push(file.bannerUrl);
            }
        })

        // 5. Resolve all collected imageModels _ids to actual cloudinary public_ids
        if(imagePublicIdsToDelete.length > 0){
            const imageModels = await ImageModel.find({
                 _id: { $in: imagePublicIdsToDelete.filter( id =>
                    mongoose.Types.ObjectId.isValid(id)
                ) } 
            }).select('public_id').lean();
            const actualCloudinaryPublicIds = imageModels.map(image => image.public_id);
            await imageDeletion(actualCloudinaryPublicIds);
        }

        // 6. delete all files within the folder
        if(fileIdsToDelete.length > 0){
            const deleteFilesResult = await FileModel.deleteMany(
                { _id: { $in: fileIdsToDelete }}
            );
        }

        // --- End Cascading Deletion for Files and Images ---



         // 7. Remove folder reference from its parent workspace
         const workspaceUpdateResult = await WorkSpaceModel.updateOne(
           { folders: new mongoose.Types.ObjectId(folderId) },
           { $pull: { 
            folders: new mongoose.Types.ObjectId(folderId)
           }}
        );
        if(workspaceUpdateResult.modifiedCount === 0){
            console.warn(`Folder reference ${folderId} not found or already removed from any workspace.`);
        }

         // 8. Delete the folder document itself
        const deleteFolderResult = await FolderModel.findByIdAndDelete(folderId)
        if(!deleteFolderResult){
            return Response.json({
                statusCode: 500,
                message: "Failed to delete the folder",
                success: false
            }, { status: 500 })
        }
       
        const payload = {
            workspaceId: String(folderToDelete.workspaceId),
            folderId: String(folderToDelete._id),
            actorId: String(userId),
        }
       try {
         await emitRealtimeEvent(
             'workspace-tree-update',
             String(folderToDelete.workspaceId),
             'folder_deleted',
             payload,
         );
       } catch (socketError) {
            console.error("[Socket Emission Failed] folder Delete: ",socketError);
       }

        return successResponse(
            "Successfully deleted the folder",
            workspaceUpdateResult,
            200,
            200,
        );
    } catch (error: any) {
        console.error("Error while deleting the folder:", error);
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500
        );
    }
}