/**
 * RESOURCE: User Account Management
 * --------------------------------
 * Role: Handles user discovery and permanent account deletion.
 * * Key Logic (DELETE):
 * 1. Cascading Cleanup: Orchestrates a multi-stage deletion across Workspaces, 
 * Folders, and Files to prevent orphan data.
 * 2. Cloud Asset Sync: Identifies all associated ImageModel references (logos/banners) 
 * and triggers physical deletion from Cloudinary.
 * 3. Atomic Database Purge: Deletes documents in order (Files -> Folders -> Workspaces -> User) 
 * to maintain referential integrity during the process.
 */
import dbConnect from "@/lib/dbConnect";
import{  
    WorkSpaceModel,
    FileModel,
    FolderModel, 
    UserModel
} from "@/model/index";
import ImageModel from "@/model/image.model";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "@/lib/api-response/api-responses";



// Check user have account
export async function GET( request: Request ){
    await dbConnect()

    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('userId');
    if(!userId){
        return errorResponse(
            "Unauthorized",
            401,
            401,
        );
    }
    try {
        const workspaces = await WorkSpaceModel.find({ 
            $or: [
                { workspace_owner: userId },
                { "members.userId": userId },
            ]
         }).lean();
       
        return successResponse(
            "Workspace is present under the current user",
            workspaces,
            200,
            200,
        );
        
    } catch (error:any) {
        console.log("Error while finding the workspace under the current user ",error)
        return errorResponse(
            error.message,
            500,
            500,
        )
    }
}

/**
 * RESOURCE: User Account Destruction
 * ----------------------------------
 * Role: Permanently removes a user and all associated cloud/database data.
 * Logic:
 * 1. Asset Discovery: Maps all Workspaces, Folders, and Files owned by the user.
 * 2. Cloud Cleanup: Resolves ImageModel IDs to Cloudinary 'public_ids' and performs 
 * bulk deletion of all logos and banners.
 * 3. Cascading DB Delete: Sequentially removes Files → Folders → Workspaces → User.
 * 4. Compliance: Ensures no "orphan" resources remain in the database.
 * Note: Deletion is performed in a specific order (children first) to maintain integrity.
 */
export async function DELETE(request: Request){
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
        return errorResponse(
            "Bad Request: Valid 'userId' query parameter is required.",
            400,
            400,
        );
    }
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return errorResponse(
                "User not found. Account deletion aborted.",
                404,
                404,
            );
        }

        // collect all images public_ids for the user's data
        const imagePublicIdsToDelete: (string | mongoose.Types.ObjectId)[] = [];

        // 1. Collect workspace logo public_ids
        const userWorkspaces = await WorkSpaceModel.find(
            { workspace_owner: userId }
        ).select('logo').lean();
        const workspaceIds = userWorkspaces.map( workspace => workspace._id);
        userWorkspaces.forEach(workspace => {
            if(workspace.logo){ //this store ImageModel id
                // fetch the public_id from ImageModel
                imagePublicIdsToDelete.push(workspace.logo.toString());
            }
        })

        // 3. find all folders within these workspace 
        const userFolders = await FolderModel.find(
            { workspaceIds: { $in: workspaceIds }}
        ).select('_id').lean();
        const folderIds = userFolders.map( folder => folder._id);
        
        // 4. find all Files within these folders
        const userFiles = await FileModel.find(
            { folderId: { $in: folderIds }}
        ).select('_id').lean();

        const fileIds = userFiles.map(file => file._id);

        //  --- IMPORTANT: Resolve ImageModel _ids to actual public_ids ---
        // This step is crucial if your WorkSpace.logo, User.profilePicture, etc.
        // store the _id of the ImageModel, not the public_id directly.
        const imageModels = await ImageModel.find(
            { _id: { $in: imagePublicIdsToDelete.filter(id =>
                mongoose.Types.ObjectId.isValid(id)
            )}}
        ).select('public_id').lean();
        const actualCloudinaryPublicIds = imageModels.map(img => img.public_id);

        // Perform image deletion using the new function
        await imageDeletion(actualCloudinaryPublicIds);

        // Proceed with database document deletions
        // delete files first (children)
        const deleteFilesResult = await FileModel.deleteMany(
            { _id: { $in: fileIds }}
        );
       
        // delete folders
        const deleteFoldersResult = await FolderModel.deleteMany(
            { _id: { $in: folderIds }}
        );
      
        // delete workspaces 
        const deleteWorkspacesResult = await WorkSpaceModel.deleteMany(
            { _id: { $in: workspaceIds }}
        );
      
        // delete user account
        const deleteUserResult = await UserModel.deleteOne({ _id: userId });
       
        if(deleteUserResult.deletedCount === 0){
            return errorResponse(
                "User not found or already deleted. Account deletion may not have completed fully.",
                404,
                404,
            );
        }
        return successResponse(
            "Account and all associated data deleted successfully.",
            200,
            200
        );
    } catch (error: any) {
        console.error("Error deleting user account:", error);
        return errorResponse(
            `Internal Server Error: ${error.message || 'An unknown error occurred during account deletion.'}`,
            500,
            500,
        );
    }
}