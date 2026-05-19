import cloudinary from "@/utils/cloudinary"


export const uploadToCloudinary = async(file:File, folder: string) => {
    // streaming image or buffering image
    const buffer = await file.arrayBuffer()
    // taking out its bits
    const bytes = Buffer.from(buffer)
    // return new Promise(async(resolve,reject) => {
    //     await cloudinary.uploader.upload_stream({
    //         resource_type: "auto",
    //         folder: folder
    //     }, async (err, result) => {
    //         if(err){
    //            return reject(err.message)
    //         }
    //        return resolve(result)
    //     }).end(bytes)
    // })
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({
            upload_preset: "studysprout",
            resource_type: "auto",
        }, (err, result) => {
            if(err) return reject(err);
            resolve(result);
        }).end(bytes);
    });
}

export const deleteFromCloudinary = async(
    public_id:string,
    resourceType: "image" | "raw" | "video" = "image"
) => {
   return new Promise(async(resolve,reject) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: resourceType
        })
        return resolve(result)
    } catch (error:any) {
        reject(new Error(error.message))
    }
   })
}
