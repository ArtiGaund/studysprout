/**
 * GET SINGLE FILE
 * ---------------
 * Role: Fetches full details for a specific file to initialize the Editor.
 * Logic:
 * 1. Validation: Ensures the 'fileId' from the URL is a valid MongoDB ObjectId
 * 2. Retrieval: Finds the document by ID.
 * 3. Integrity: Returns a 404 if the file is missing or has been hard-deleted.
 * 4. Context: Provides metadata (banner, icon) and binary content for Yjs hydration.
 */
import dbConnect from "@/lib/dbConnect"
import {FileModel} from "@/model/index"
import { bumpFileVersion } from "@/lib/file/bumpFileVersion";
import { 
    FolderModel, 
    WorkSpaceModel
} from "@/model/index";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { hasWorkspaceAccess } from "@/helpers/hasWorkspaceAccess";
import ImageModel from "@/model/image.model"
import { resourceDeletion } from "@/lib/cloudinary-utils/resourceDeletion"
import { isValidId } from "@/helpers/validateId";
import { emitRealtimeEvent } from "@/lib/realtime-fetch";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";


export async function GET(
    request: Request,
     { params }: { params: { fileId: string }}
) {
    await dbConnect()
    const fileId = params.fileId
    if(!fileId || !isValidId(fileId)){
        return errorResponse(
            "file id not found or invalid file id",
            401,
            401
        )
    }
    try {
        const file = await FileModel.findById({
            _id: fileId
        })
        if(!file){
            return errorResponse(
                "No file from this id present",
                404,
                404,
            )
        }
        return successResponse(
            "Successfully fetched current file",
            file,
            200,
            200
        );
    } catch (error: any) {
         console.error("Error while fetching current file:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return errorResponse(
                "Bad Request: Invalid ID format provided for file.",
                400,
                400
             );
        }

        // Generic internal server error
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500
        );
    }
}


/**
 * UPDATE FILE
 * -----------
 * Logic:
 * 1. Targeted Updates: Explicitly maps allowed fields (title, icon, inTrash) to prevent injection.
 * 2. State Mapping: Detects 'inTrash' changes to toggle 'file_trashed' vs 'file_restored' events.
 * 3. Versioning: Calls 'bumpFileVersion' to handle conflict resolution.
 * 4. Delayed Socket: Uses a small timeout for the emission to ensure DB consistency before UI update.
 */

export async function POST(
    request: Request,
    { params }: { params: { fileId: string }}
) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if(!session?.user._id){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }

    try {
       const updatedData = await request.json();
        const { _id, ...updates } = updatedData;

        // 1. Validate File ID
        const fileId = params.fileId;
        if(!fileId|| !isValidId(fileId)){
                return errorResponse(
                     "Bad Request: File ID is required and must be a valid ObjectId.",
                     400,
                     400
                );
            }
           
            // 2. Find the original document
            let file = await FileModel.findById(fileId);

            if(!file){
                return errorResponse(
                    "File not found in the database.",
                    400,
                    400,
                );
            }

              const userId = session.user._id;

            const workspace = await WorkSpaceModel.findById(file.workspaceId);

            if(!workspace){
                return errorResponse(
                    "Workspace not found in the database.",
                    404,
                    404,
                );
            }

            const hasAccess = hasWorkspaceAccess(workspace, userId);

            if(!hasAccess){
                return errorResponse(
                    "You don't have permission to update this file.",
                    403,
                    403,
                )
            }
            let eventType:string = "";

        //apply allowed updates explicitly
        if(updates.title !== undefined) file.title = updates.title;
        if(updates.iconId !== undefined) file.iconId = updates.iconId;
        if(updates.bannerUrl !== undefined) file.bannerUrl = updates.bannerUrl;
        if(updates.folderId !== undefined) file.folderId = updates.folderId;
        if("inTrash" in updates){
            if(!updates.inTrash && file.inTrash){
                file.inTrash = null;
                eventType = "file_restored";
            }else{
                file.inTrash = updates.inTrash;
                eventType = "file_trashed";
            }
        }else{
            eventType = "file_updated";
        }
        if(updates.workspaceId !== undefined) file.workspaceId = updates.workspaceId;
           // updating file version
                  bumpFileVersion(file);
            // 4. Await the save operation
           await file.save();
        console.log("[update 9file route] eventType: ",eventType);


        const payload = {
            fileId: String(file._id),
            folderId: String(file.folderId),
            workspaceId: String(file.workspaceId),
            actorId: String(userId),
            updates: {
                ...file.toObject(),
                inTrash: file.inTrash ?? null,
            }
        };

      try {
          setTimeout(async () => await emitRealtimeEvent(
              'workspace-tree-update',
              String(file.workspaceId),
              eventType,
              payload
          ), 500);
      } catch (socketError) {
        console.error("[Socket Emission Failed] File update: ",socketError);
      }
        
             return successResponse(
                "File updated successfully.",
                file,
                200,
                200,
             );
    } catch (error: any) {
        console.error("Error while updating the file:", error);

        // Handle specific Mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return errorResponse(
                `Validation Error: ${messages.join(', ')}`,
                400,
                400,
            )
        }
        // Handle CastError for invalid ObjectId if it wasn't caught earlier
        if (error.name === 'CastError' && error.path === '_id') {
             return errorResponse(
                "Bad Request: Invalid file ID format provided.",
                400,
                400
             )
        }

        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        )
    }
}

/**
 * PERMANENT DELETE FILE
 * ---------------------
 * Logic:
 * 1. Image Cleanup: Identifies and deletes associates Cloudinary banners/icons.
 * 2. Decoupling: Pulls the File ID from the parent Folder's array to maintain referential integrity.
 * 3. Destruction: Removes the File document from the database.
 * 4. Global Sync: Emits 'file_deleted' to clear the item from all active users sidebars.
 */
export async function DELETE(
    request: Request,
    { params }: { params: { fileId: string}}
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

    const fileId = params.fileId;
     
    if(!fileId){
        return errorResponse(
            "File id is required",
            400,
            400,
        );
    }
    if (!isValidId(fileId)) {
        return errorResponse(
            "Bad Request: Invalid 'fileId' format.",
            400,
            400,
        );
    }

    try {
        // Find the file first to get its details, including any associated images, before deleting it
        const fileToDelete = await FileModel.findById(fileId).lean();
        console.log("File to delete ",fileToDelete);
        if(!fileToDelete){
             return errorResponse(
                "File not found.",
                404,
                404,
             );
        }

        const workspace = await WorkSpaceModel.findById(fileToDelete.workspaceId).lean();
        if(!workspace){
            return errorResponse(
                "Workspace not found.",
                404,
                404,
            );
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

        // 2. collect image public_ids associated with this file (if any)
        const imagePublicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [];

        // if file have bannerur or logo field that stores an imageModel _id
        if(fileToDelete.bannerUrl){
            imagePublicIdsToDelete.push(fileToDelete.bannerUrl);
        }

        // 3. delete associated images from cloudinary and imageModel
        if(imagePublicIdsToDelete.length > 0){
            const imageModels = await ImageModel.find(
                { _id: { $in: imagePublicIdsToDelete.filter(id => 
                    mongoose.Types.ObjectId.isValid(id)
                )}}
            ).select('public_id').lean();
            const actualCloudinaryPublicIds = imageModels.map(image => image.public_id);
            await resourceDeletion(actualCloudinaryPublicIds);
        }
         // 4. remove file reference from parent folder 
         const folderUpdateResult = await FolderModel.updateOne(
            { files: new mongoose.Types.ObjectId(fileId) }, //find folder that contain this fileId
            { $pull: { files: new mongoose.Types.ObjectId(fileId) } } //Pull the objectId from the array
        );
        
        if(folderUpdateResult.modifiedCount === 0){
            console.warn(`File reference ${fileId} not found or already removed from any folder.`);
            return errorResponse(
                "Failed to remove file reference",
                405,
                405,
            );
        }
        //5. delete file document itself
        const deleteFile = await FileModel.findByIdAndDelete(fileId)
        if(!deleteFile){
            return errorResponse(
                "Failed to delete the file",
                500,
                500,
            );
        }
       
        const payload = {
            workspaceId: String(workspace._id),
            folderId: String(fileToDelete.folderId),
            actorId: String(userId),
            fileId: String(fileId),
        }

       try {
         await emitRealtimeEvent(
             'workspace-tree-update',
             String(workspace._id),
             'file_deleted',
             payload
         );
       } catch (socketError) {
            console.error("[Socket Emission Failed] File Delete: ",socketError);
       }
       
      const data = { folderUpdateResult }
        return successResponse(
            "Successfully deleted the file",
            data,
            200,
            200,
        );
    } catch (error: any) {
        console.log("Error while deleting the file ",error.message)
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            500,
            500,
        );
    }
}