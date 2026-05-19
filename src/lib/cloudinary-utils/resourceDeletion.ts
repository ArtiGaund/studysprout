import { deleteFromCloudinary } from "@/lib/cloudinary-utils/upload-and-delete-from-cloudinary";
import { ImageModel } from "@/model";
import mongoose from "mongoose";


export async function resourceDeletion(
    publicIds: (string | mongoose.Types.ObjectId)[],
    type: "image" | "raw" = "image"
): Promise<void>{
    if(!publicIds || publicIds.length === 0){
        return;
    }
    // convert objectIds to string if necessary
    const stringPublicIds = publicIds.map(id =>
        typeof id === 'object' && id instanceof mongoose.Types.ObjectId ? id.toString() : id
    ).filter(Boolean) as string[];

    if(stringPublicIds.length === 0){
        console.log("No valid string public IDs after conversion for resource deletion.");
        return;
    }
    const results = await Promise.allSettled(stringPublicIds.map(async (publicId) => {
        try {
            // Delete from cloudinary
            const cloudResult = await deleteFromCloudinary(publicId, type);

            // delete from imageModel
            if(type === "image"){
                const dbResult = await ImageModel.deleteOne({ public_id: publicId });

                if(dbResult.deletedCount === 0){
                    console.warn(`Image with public_id ${publicId} not found in ImageModel, but attempted Cloudinary delete.`);
                }
            }
            

            return {
                status: 'fulfiled',
                publicId
            };
        } catch (error: any) {
            console.error(`[resouceDeletion] Failed: ${publicId}:`, error);
            return { status: 'rejected', publicId, error: error.message };
        }
    }))
    // log aggregation result
    const rejectedDeletions = results.filter(result => result.status === 'rejected');
}

