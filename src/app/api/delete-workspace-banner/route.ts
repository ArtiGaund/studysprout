import dbConnect from "@/lib/dbConnect";
// import { deleteImageFromCloud } from "@/lib/image-handler/upload-and-delete-image-cloudinary";
import ImageModel from "@/model/image.model";
import {WorkSpaceModel} from "@/model/index";
import { imageDeletion } from "@/lib/image-handler/imageDeletion";
import mongoose from "mongoose";


export async function DELETE(request:Request) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    // 1. Validate workspaceId
    if(!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)){
        return Response.json({
            statusCode: 400,
            message:  "Bad Request: Valid 'workspaceId' query parameter is required.",
            success:false
        }, { status: 400 })
    }
    try {
       // 2. Find the workspace to get its current bannerUrl (ImageModel _id)
        const workspace = await WorkSpaceModel.findById(workspaceId).lean();

        if(!workspace){
            return Response.json({
                statusCode: 404,
                message: "workspace not found in database",
                success: false
            }, { status: 404 })
        }

        const imageToDelete = workspace.bannerUrl

         // If there's no banner image associated, just return success
        if (!imageToDelete) {
            return Response.json({
                statusCode: 200,
                message: "Workspace has no banner image to delete.",
                success: true
            }, { status: 200 });
        }

        // 3. Resolve ImageModel _id to Cloudinary public_id and delete image
        const publicIdsToProcess: (string | mongoose.Types.ObjectId)[] = [imageToDelete];
        const imageModels = await ImageModel.find({ _id: { $in: publicIdsToProcess.filter(id =>
            mongoose.Types.ObjectId.isValid(id)) } }).select('public_id').lean();
        const actualCloudinaryPublicIds = imageModels.map(img => img.public_id);
        if (actualCloudinaryPublicIds.length > 0) {
            await imageDeletion(actualCloudinaryPublicIds);
        } else {
            console.warn(`Workspace ${workspaceId} had bannerUrl ${imageToDelete} but no corresponding ImageModel found.`);
        }

        // 4. Update the Workspace document to clear its bannerUrl
        const updatedWorkspace = await WorkSpaceModel.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(workspaceId) },
            { $set: { bannerUrl: null } },
            { new: true }
        ).lean();

        if(!updatedWorkspace){
            return Response.json({
                statusCode: 500, // Internal Server Error
                message: "Failed to clear bannerUrl on the workspace document.", // Corrected message
                success: false
            }, { status: 500 });
        }
        

        return Response.json({
                statusCode: 200,
                message: "Successfully deleted banner for the folder.", // Added period for consistency
                success: true,
                data: updatedWorkspace
            }, { status: 200 });
    } catch (error: any) {
        console.error("Error while deleting file banner:", error); // Changed message for consistency
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}