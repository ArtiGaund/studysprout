import cloudinary from "@/utils/cloudinary"


export const uploadImage = async(file:File, folder: string) => {
    // streaming image or buffering image
    const buffer = await file.arrayBuffer()
    // taking out its bits
    const bytes = Buffer.from(buffer)
    return new Promise(async(resolve,reject) => {
        await cloudinary.uploader.upload_stream({
            resource_type: "auto",
            folder: folder
        }, async (err, result) => {
            if(err){
               return reject(err.message)
            }
           return resolve(result)
        }).end(bytes)
    })
}

export const deleteImageFromCloud = async(public_id:string) => {
   return new Promise(async(resolve,reject) => {
    try {
        const result = await cloudinary.uploader.destroy(public_id)
        return resolve(result)
    } catch (error:any) {
        reject(new Error(error.message))
    }
   })
}
