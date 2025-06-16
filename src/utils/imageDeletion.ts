import { deleteImageFromCloud } from "@/lib/upload-image";
import { ImageModel } from "@/model";
import mongoose from "mongoose";


export async function deleteImage(publicIds: (string | mongoose.Types.ObjectId)[]): Promise<void>{
    if(!publicIds || publicIds.length === 0){
        console.log("No public IDs provided for image deletion.");
        return;
    }
    // convert objectIds to string if necessary
    const stringPublicIds = publicIds.map(id =>
        typeof id === 'object' && id instanceof mongoose.Types.ObjectId ? id.toString() : id
    ).filter(Boolean) as string[];

    if(stringPublicIds.length === 0){
        console.log("No valid string public IDs after conversion for image deletion.");
        return;
    }
    console.log(`Attempting to delete ${stringPublicIds.length} images...`);

    const results = await Promise.allSettled(stringPublicIds.map(async (publicId) => {
        try {
            // Delete from cloudinary
            const cloudResult = await deleteImageFromCloud(publicId);

            // delete from imageModel
            const dbResult = await ImageModel.deleteOne({ public_id: publicId });

            if(dbResult.deletedCount === 0){
                 console.warn(`Image with public_id ${publicId} not found in ImageModel, but attempted Cloudinary delete.`);
            }

            return {
                status: 'fulfiled',
                publicId
            };
        } catch (error: any) {
            console.error(`Failed to delete image with public_id ${publicId}:`, error);
            return { status: 'rejected', publicId, error: error.message };
        }
    }))
    // log aggregation result
    const rejectedDeletions = results.filter(result => result.status === 'rejected');
        if (rejectedDeletions.length > 0) {
            console.warn(`Finished image deletion with ${rejectedDeletions.length} failures.`);
        } else {
            console.log("All image deletion attempts completed successfully (or no images to delete).");
        }
}

