import dbConnect from "@/lib/dbConnect";
import {UserModel} from "@/model/index";


export async function GET(request: Request ) {
    await dbConnect()
    const { searchParams } = new URL(request.url)
    const queryParams = {
        userId: searchParams.get('userId')
    }
    if(!queryParams){
         return Response.json({
            statusCode: 401,
             message: "Not login",
            success: false
        })
    }
    const userId = queryParams.userId
    try {
                    
        const user = await UserModel.findById({
            _id: userId
        })
        if(!user){
            return Response.json({
                statusCode: 404,
                message: "No user present",
                success: false
            }, { status: 404 })
        }
        return Response.json({
            statusCode: 200,
            message: "Successfully fetched public url",
            success: true,
            data: user
        }, { status: 200 })
    } catch (error: any) {
         console.error("Error while fetching user from database:", error);

        // Handle specific Mongoose errors if necessary
        if (error.name === 'CastError') {
             return Response.json({
                statusCode: 400,
                message: "Bad Request: Invalid ID format provided for user.",
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