import dbConnect from "@/lib/dbConnect"
import {FileModel, FolderModel, ImageModel, UserModel, WorkSpaceModel} from "@/model/index"
import { imageDeletion } from "@/lib/image-handler/imageDeletion"
import mongoose from "mongoose"



export async function DELETE(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
     // 1. Validate workspaceId
    if(!workspaceId){
        return Response.json({
            statusCode: 400,
            message: "Bad Request: 'workspaceId' query parameter is required.",
            success:false
        }, { status: 400 })
    }
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
        return Response.json({
            statusCode: 400,
            message: "Bad Request: Invalid 'workspaceId' format.",
            success: false
        }, { status: 400 });
    }
    try {
        // 2. find the workspace first to get its details and its folders and its files, before deleting it
        const workspaceToDelete = await WorkSpaceModel.findById(workspaceId).lean();

        if(!workspaceToDelete){
             return Response.json({
                statusCode: 404, // Not Found
                message: "Workspace not found in database.",
                success: false
            }, { status: 404 });
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
            await imageDeletion(actualCloudinaryPublicIds);
        }

        // 7. delete all files within the folders
        if(fileIdsToDelete.length > 0){
            const deleteFilesResult = await FileModel.deleteMany(
                { _id: { $in: fileIdsToDelete}}
            )
            console.log(`Deleted ${deleteFilesResult.deletedCount} files within workspace ${workspaceId}.`);
        }
        // 8. delete all folders within the workspace
        if(folderIdsToDelete.length > 0){
            const deleteFoldersResult = await FolderModel.deleteMany(
                { _id: { $in: folderIdsToDelete}}
            )
            console.log(`Deleted ${deleteFoldersResult.deletedCount} folders within workspace ${workspaceId}.`);
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
            return Response.json({
                statusCode: 500, // Internal Server Error
                message: "Failed to delete the workspace document.",
                success: false
            }, { status: 500 });
        }
        // 11. Return success response
        return Response.json({
            statusCode: 200,
            message: "Workspace and all its contents (folders, files, images) deleted successfully.",
            success: true,
        }, { status: 200 });
    } catch (error: any) {
       console.error("Error while deleting the workspace:", error);
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }

}
