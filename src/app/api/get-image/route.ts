import dbConnect from "@/lib/dbConnect";
import ImageModel from "@/model/image.model";


export async function GET(request: Request ) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        imageId: searchParams.get('imageId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "No image id present",
            success: false
        })
    }
    const imageId = queryParams.imageId
    console.log("Image id in get image ",imageId)
    try {
                    
        const image = await ImageModel.findById({
            _id: imageId
        })
        // console.log("Image in get image ",image)
        // TODO show image by public id not by image url
        // const publicId = image?.public_id
        const imageUrl = image?.image_url
        if(!imageUrl){
            return Response.json({
                statusCode: 400,
                message: "No public url present",
                success: false
            })
        }
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched public url",
            success: true,
            data: imageUrl
        })
    } catch (error) {
        console.log("Error while fetching image from the database ", error)
        return Response.json({
            statusCode: 500,
            message: "Error while fetching image from the database",
            success: false
        })
    }
}