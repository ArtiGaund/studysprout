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
                statusCode: 404,
                message: "No public url present",
                success: false
            }, { status: 404})
        }
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched public url",
            success: true,
            data: imageUrl
        }, { status: 200 })
    } catch (error: any) {
         console.error("Error while fetching image from database:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid ID format provided for image.",
                success: false
            }, { status: 400 });
        }

        // Generic internal server error
        return Response.json({
            statusCode: 500,
            message: `Internal Server Error: ${error.message || 'An unknown error occurred.'}`,
            success: false
        }, { status: 500 });
    }
}