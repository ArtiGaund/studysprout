import dbConnect from "@/lib/dbConnect";
import ImageModel from "@/model/image.model";
import {FileModel, FolderModel, WorkSpaceModel, UserModel} from "@/model/index";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";
import mongoose from "mongoose";

export async function DELETE(request: Request){
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if(!userId || !mongoose.Types.ObjectId.isValid(userId)){
        return Response.json({
            statusCode: 400,
            message: "Bad Request: Valid 'userId' query parameter is required.",
            success: false
        }, { status: 400 });
    }
    try {
        const user = await UserModel.findById(userId);
        if (!user) {
            return Response.json({
                statusCode: 404,
                message: "User not found. Account deletion aborted.",
                success: false
            }, { status: 404 });
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

        // 2. collect public ids from user's profile picture 
        // if(user.profile_picture){
        //     imagePublicIdsToDelete.push(user.profile_picture.toString());
        // }

        // 3. find all folders within these workspace 
        const userFolders = await FolderModel.find(
            { workspaceIds: { $in: workspaceIds }}
        ).select('_id').lean();
        const folderIds = userFolders.map( folder => folder._id);
        // If folders can have images (e.g., bannerUrl), collect those public_ids here:
        // userFolders.forEach(f => { if (f.bannerUrl) imagePublicIdsToDelete.push(f.bannerUrl); });

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
        console.log(`Deleted ${deleteFilesResult.deletedCount} files.`)

        // delete folders
        const deleteFoldersResult = await FolderModel.deleteMany(
            { _id: { $in: folderIds }}
        );
        console.log(`Deleted ${deleteFoldersResult.deletedCount} folders.`);

        // delete workspaces 
        const deleteWorkspacesResult = await WorkSpaceModel.deleteMany(
            { _id: { $in: workspaceIds }}
        );
        console.log(`Deleted ${deleteWorkspacesResult.deletedCount} workspaces.`);

        // delete user account
        const deleteUserResult = await UserModel.deleteOne({ _id: userId });
        console.log(`Deleted ${deleteUserResult.deletedCount} user account.`);

        if(deleteUserResult.deletedCount === 0){
            return Response.json({
                statusCode: 404,
                message: "User not found or already deleted. Account deletion may not have completed fully.",
                success: false
            }, { status: 404 });
        }
        return Response.json({
            statusCode: 200,
            message: "Account and all associated data deleted successfully.",
            success: true
        }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting user account:", error);
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred during account deletion.'}`,
            success: false
        }, { status: 500 });
    }
}