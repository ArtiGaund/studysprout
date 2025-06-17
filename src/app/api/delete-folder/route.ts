import dbConnect from "@/lib/dbConnect"
import {FileModel, FolderModel, ImageModel, WorkSpaceModel} from "@/model/index"
import { imageDeletion } from "@/lib/image-handler/imageDeletion"
import mongoose from "mongoose"


export async function DELETE(request: Request){
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId')
    // 1. Validate folderId
    if(!folderId){
        return Response.json({
            statusCode: 400,
            message: "Folder id required",
            success:false
        }, { status: 400 })
    }
     if (!mongoose.Types.ObjectId.isValid(folderId)) {
        return Response.json({
            statusCode: 400,
            message: "Bad Request: Invalid 'folderId' format.",
            success: false
        }, { status: 400 });
    }

    try {
        // 2. find the folder first to get its details and its files, before deletion
        const folderToDelete = await FolderModel.findById(folderId).lean();

        if (!folderToDelete) {
            return Response.json({
                statusCode: 404, // Not Found
                message: "Folder not found in database.",
                success: false
            }, { status: 404 });
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
            console.log(`Deleted ${deleteFilesResult.deletedCount} files within folder ${folderId}.`);
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
       
        return Response.json({
            statusCode: 200,
            message: "Successfully deleted the folder",
            success: true,
            data: workspaceUpdateResult
        }, { status: 200 })
    } catch (error: any) {
        console.error("Error while deleting the folder:", error);
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }

}